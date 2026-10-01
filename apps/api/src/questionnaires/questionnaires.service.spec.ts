import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnairesService } from './questionnaires.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { CertificatesService } from 'src/certificates/certificates.service';
import { AttemptStatus } from '@prisma/client';

describe('QuestionnairesService', () => {
  let service: QuestionnairesService;
  let prisma: any;
  let auditLog: any;
  let certificatesService: any;

  beforeEach(async () => {
    prisma = {
      questionnaire: {
        findUnique: jest.fn(),
      },
      questionnaireAttempt: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      questionnaireAnswer: {
        upsert: jest.fn(),
      },
      enrollment: {
        findUnique: jest.fn(),
      },
      sessionProgress: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditLog = {
      log: jest.fn().mockResolvedValue(true),
    };

    certificatesService = {
      issue: jest.fn().mockResolvedValue({ id: 'cert-1', code: 'CERT-ABC' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnairesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: CertificatesService, useValue: certificatesService },
      ],
    }).compile();

    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startAttempt', () => {
    it('creates an in-progress attempt and strips isCorrect from questions', async () => {
      const qMock = {
        id: 'q-1',
        title: 'Quiz 1',
        description: 'Test',
        passingScore: 70,
        maxAttempts: 3,
        questions: [
          {
            id: 'ques-1',
            text: 'What is 2+2?',
            type: 'MULTIPLE_CHOICE',
            position: 0,
            options: [
              { id: 'opt-1', text: '4', position: 0, isCorrect: true },
              { id: 'opt-2', text: '5', position: 1, isCorrect: false },
            ],
          },
        ],
      };

      prisma.questionnaire.findUnique.mockResolvedValue(qMock);
      prisma.questionnaireAttempt.count.mockResolvedValue(0);
      prisma.questionnaireAttempt.findFirst.mockResolvedValue(null);
      prisma.questionnaireAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        questionnaireId: 'q-1',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        answers: [],
      });

      const res = await service.startAttempt('q-1', 'user-1');

      expect(res.attemptId).toBe('attempt-1');
      expect(res.questions[0].options[0]).toEqual({
        id: 'opt-1',
        text: '4',
        position: 0,
      });
      expect((res.questions[0].options[0] as any).isCorrect).toBeUndefined();
    });
  });

  describe('submitAttempt', () => {
    it('calculates score and passes when score reaches passing threshold', async () => {
      const attemptMock = {
        id: 'attempt-1',
        userId: 'user-1',
        questionnaireId: 'q-1',
        enrollmentId: 'enr-1',
        status: AttemptStatus.IN_PROGRESS,
        questionnaire: {
          id: 'q-1',
          sessionId: 'sess-1',
          passingScore: 50,
          questions: [
            {
              id: 'ques-1',
              text: 'Capital of France?',
              type: 'MULTIPLE_CHOICE',
              explanation: 'Paris is the capital of France.',
              options: [
                { id: 'opt-paris', text: 'Paris', isCorrect: true, position: 0 },
                { id: 'opt-lyon', text: 'Lyon', isCorrect: false, position: 1 },
              ],
            },
          ],
        },
      };

      prisma.questionnaireAttempt.findUnique.mockResolvedValue(attemptMock);
      prisma.questionnaireAttempt.update.mockResolvedValue({
        ...attemptMock,
        status: AttemptStatus.SUBMITTED,
        isPassed: true,
      });

      const res = await service.submitAttempt('q-1', 'attempt-1', 'user-1', {
        answers: [{ questionId: 'ques-1', selectedOptionIds: ['opt-paris'] }],
      });

      expect(res.isPassed).toBe(true);
      expect(res.score).toBe(1);
      expect(res.totalScore).toBe(1);
      expect(res.scorePercentage).toBe(100);
      expect(prisma.sessionProgress.upsert).toHaveBeenCalled();
      expect(auditLog.log).toHaveBeenCalled();
    });
  });
});
