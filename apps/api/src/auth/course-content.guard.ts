import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ContentKind = 'course' | 'section' | 'session' | 'video' | 'resource' | 'questionnaire';
export const ContentKind = (kind: ContentKind) => SetMetadata('content-kind', kind);

/** Staff content access, independent of the visibility of frontend controls. */
@Injectable()
export class CourseContentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const kind = this.reflector.getAllAndOverride<ContentKind>('content-kind', [context.getHandler(), context.getClass()]);
    const { id, courseId, sectionId, sessionId, qId } = req.params;
    const body = req.body ?? {};
    const write = !['GET', 'HEAD'].includes(req.method);
    let where: Prisma.CourseWhereInput;
    if (kind === 'course') {
      // Collection reads are scoped in CoursesService; creation assigns the actor.
      if (!id) return true;
      where = { productId: id };
    } else if (kind === 'section') {
      const parent = courseId ?? body.courseId;
      where = parent ? { OR: [{ id: parent }, { productId: parent }] } : { sections: { some: { id: id ?? '' } } };
    } else if (kind === 'session') {
      const parent = sectionId ?? body.sectionId;
      where = { sections: { some: parent ? { id: parent } : { sessions: { some: { id: id ?? '' } } } } };
    } else {
      const parent = sessionId ?? body.sessionId ?? req.query.sessionId;
      let session: Prisma.SessionWhereInput;
      if (parent) session = { id: parent };
      else if (kind === 'resource') session = { resources: { some: { id: id ?? '' } } };
      else if (kind === 'questionnaire') session = { questionnaire: qId ? { questions: { some: { id: qId } } } : { id: id ?? '' } };
      else throw new BadRequestException('Session ID is required');
      where = { sections: { some: { sessions: { some: session } } } };
    }
    const course = await this.prisma.course.findFirst({ where, include: { product: true } });
    if (!course) throw new NotFoundException('Course content not found');
    const manager = req.user.roles.some((role: string) => ['MANAGER', 'SUPER_ADMIN'].includes(role));
    if (course.authorId !== req.user.id && (write || !manager)) throw new ForbiddenException('You can only edit your own course content');
    if (write && !['DRAFT', 'CHANGES_REQUESTED'].includes(course.product.status)) {
      throw new ForbiddenException('Only drafts and courses requiring changes can be edited. Unpublish a live course before editing.');
    }
    return true;
  }
}
