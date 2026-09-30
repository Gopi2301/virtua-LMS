import { describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CourseContentGuard } from './course-content.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';

// This suite exercises local permission resolution, not remote JWT verification.
jest.unstable_mockModule('jwks-rsa', () => ({ passportJwtSecret: () => () => {} }));

function context(method: string, userId: string, roles: string[], params = { id: 'product-1' }): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ method, user: { id: userId, roles }, params, body: {}, query: {} }) }), getClass: () => class Controller {}, getHandler: () => () => {} } as unknown as ExecutionContext;
}

describe('Console access boundaries', () => {
  function guard(status = 'DRAFT') {
    const prisma = { course: { findFirst: async () => ({ authorId: 'author-1', product: { status } }) } };
    return new CourseContentGuard(prisma as unknown as PrismaService, { getAllAndOverride: () => 'course' } as unknown as Reflector);
  }

  it('allows authors to edit their own drafts', async () => {
    await expect(guard().canActivate(context('PUT', 'author-1', ['AUTHOR']))).resolves.toBe(true);
  });
  it('prevents authors from reading another author’s draft', async () => {
    await expect(guard().canActivate(context('GET', 'author-2', ['AUTHOR']))).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('lets a manager review another author’s content but not overwrite it', async () => {
    await expect(guard().canActivate(context('GET', 'manager', ['MANAGER']))).resolves.toBe(true);
    await expect(guard().canActivate(context('PUT', 'manager', ['MANAGER']))).rejects.toBeInstanceOf(ForbiddenException);
  });
  for (const status of ['IN_REVIEW', 'APPROVED', 'ON_AIR', 'ARCHIVED']) {
    it(`prevents content changes while ${status}`, async () => {
      await expect(guard(status).canActivate(context('PUT', 'author-1', ['AUTHOR']))).rejects.toBeInstanceOf(ForbiddenException);
    });
  }
  it('does not restore a revoked role from a stale Keycloak token', async () => {
    const { JwtStrategy } = await import('./jwt.strategy');
    const prisma = { user: { findUnique: async () => ({ id: 'author-1', roles: ['STUDENT'], isActive: true, email: 'author@example.test', firstName: 'Saved', lastName: 'Name' }), update: async () => ({}) } };
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);
    const user = await strategy.validate({ sub: 'author-1', realm_access: { roles: ['SUPER_ADMIN', 'AUTHOR'] } });
    expect(user.roles).toEqual(['STUDENT']);
    expect(user.name).toBe('Saved Name');
  });
  it('scopes author lists and keeps unpublished courses out of the public catalog', async () => {
    const queries: unknown[] = [];
    const prisma = { product: { findMany: async (query: unknown) => { queries.push(query); return []; }, count: async () => 0 } };
    const service = new CoursesService(prisma as unknown as PrismaService);
    await service.query({ page: 1, limit: 10 }, { id: 'author-1', roles: ['AUTHOR'], email: '', username: '', name: '' });
    await service.query({ page: 1, limit: 10, status: 'DRAFT' });
    expect(queries[0]).toEqual(expect.objectContaining({ where: { type: 'COURSE', course: { authorId: 'author-1' } } }));
    expect(queries[1]).toEqual(expect.objectContaining({ where: { type: 'COURSE', status: 'ON_AIR' } }));
  });
});
