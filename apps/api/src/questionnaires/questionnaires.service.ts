import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttemptStatus, AuditAction, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { CertificatesService } from 'src/certificates/certificates.service';
import {
  CreateOptionDto,
  CreateQuestionDto,
  CreateQuestionnaireDto,
  StartAttemptDto,
  SubmitAttemptDto,
  UpdateOptionDto,
  UpdateQuestionDto,
  UpdateQuestionnaireDto,
} from './dto';

@Injectable()
export class QuestionnairesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly certificatesService: CertificatesService,
  ) {}

  private validateOptions(options: CreateOptionDto[] | undefined, type: string) {
    if (!options) return;
    const correct = options.filter(option => option.isCorrect).length;
    if (options.length < 2 || options.some(option => !option.text.trim()) || correct < 1 || (type !== 'MULTIPLE_SELECT' && correct !== 1) || (type === 'TRUE_FALSE' && options.length !== 2)) {
      throw new BadRequestException('Provide at least two answers and the correct answer(s) for this question type');
    }
  }

  private readonly treeInclude = {
    questions: {
      orderBy: { position: 'asc' as const },
      include: {
        options: {
          orderBy: { position: 'asc' as const },
        },
      },
    },
  };

  /**
   * Helper to verify session and course author
   */
  private async resolveSessionAuthor(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  /**
   * Helper to verify questionnaire and course author
   */
  private async resolveQuestionnaireAuthor(questionnaireId: string) {
    const q = await this.prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        session: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!q) {
      throw new NotFoundException('Questionnaire not found');
    }

    return q;
  }

  /**
   * Helper to verify question and course author
   */
  private async resolveQuestionAuthor(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionnaire: {
          include: {
            session: {
              include: {
                section: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  /**
   * Helper to verify option and course author
   */
  private async resolveOptionAuthor(optionId: string) {
    const option = await this.prisma.questionOption.findUnique({
      where: { id: optionId },
      include: {
        question: {
          include: {
            questionnaire: {
              include: {
                session: {
                  include: {
                    section: {
                      include: {
                        course: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!option) {
      throw new NotFoundException('Question option not found');
    }

    return option;
  }

  /**
   * Create a questionnaire for a session
   */
  async create(dto: CreateQuestionnaireDto, userId: string) {
    const session = await this.resolveSessionAuthor(dto.sessionId);

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only create questionnaires for your own courses');
    }

    const existing = await this.prisma.questionnaire.findUnique({
      where: { sessionId: dto.sessionId },
    });

    if (existing) {
      throw new ConflictException('A questionnaire already exists for this session');
    }

    return this.prisma.questionnaire.create({
      data: {
        sessionId: dto.sessionId,
        title: dto.title,
        description: dto.description,
        passingScore: dto.passingScore ?? 0,
        maxAttempts: dto.maxAttempts ?? 0,
      },
      include: this.treeInclude,
    });
  }

  /**
   * Find questionnaire by session ID
   */
  async findBySessionId(sessionId: string) {
    await this.resolveSessionAuthor(sessionId);

    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { sessionId },
      include: this.treeInclude,
    });

    if (!questionnaire) {
      throw new NotFoundException('No questionnaire found for this session');
    }

    return questionnaire;
  }

  /**
   * Find single questionnaire by ID
   */
  async findOne(id: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
      include: this.treeInclude,
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    return questionnaire;
  }

  /**
   * Update questionnaire settings
   */
  async update(id: string, dto: UpdateQuestionnaireDto, userId: string) {
    const q = await this.resolveQuestionnaireAuthor(id);

    if (q.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only update questionnaires in your own courses');
    }

    return this.prisma.questionnaire.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        passingScore: dto.passingScore,
        maxAttempts: dto.maxAttempts,
      },
      include: this.treeInclude,
    });
  }

  /**
   * Delete questionnaire
   */
  async remove(id: string, userId: string) {
    const q = await this.resolveQuestionnaireAuthor(id);

    if (q.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only delete questionnaires in your own courses');
    }

    await this.prisma.questionnaire.delete({
      where: { id },
    });

    return { message: 'Questionnaire deleted successfully', id };
  }

  /**
   * Add a question to questionnaire
   */
  async addQuestion(questionnaireId: string, dto: CreateQuestionDto, userId: string) {
    this.validateOptions(dto.options, dto.type ?? 'MULTIPLE_CHOICE');
    const q = await this.resolveQuestionnaireAuthor(questionnaireId);

    if (q.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only add questions to your own questionnaires');
    }

    let targetPosition = dto.position;

    if (targetPosition === undefined || targetPosition === null) {
      const highest = await this.prisma.question.findFirst({
        where: { questionnaireId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      targetPosition = highest ? highest.position + 1 : 0;
    } else {
      const existingAtPos = await this.prisma.question.findUnique({
        where: {
          questionnaireId_position: {
            questionnaireId,
            position: targetPosition,
          },
        },
      });

      if (existingAtPos) {
        await this.prisma.$transaction(async (tx) => {
          const toShift = await tx.question.findMany({
            where: {
              questionnaireId,
              position: { gte: targetPosition },
            },
            orderBy: { position: 'desc' },
          });

          for (const item of toShift) {
            await tx.question.update({
              where: { id: item.id },
              data: { position: item.position + 1 },
            });
          }
        });
      }
    }

    return this.prisma.question.create({
      data: {
        questionnaireId,
        text: dto.text,
        type: dto.type,
        explanation: dto.explanation,
        position: targetPosition,
        ...(dto.options ? { options: { create: dto.options.map((option, position) => ({ text: option.text.trim(), isCorrect: option.isCorrect ?? false, position })) } } : {}),
      },
      include: {
        options: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Update question
   */
  async updateQuestion(
    questionnaireId: string,
    questionId: string,
    dto: UpdateQuestionDto,
    userId: string,
  ) {
    const question = await this.resolveQuestionAuthor(questionId);

    if (question.questionnaireId !== questionnaireId) {
      throw new NotFoundException('Question does not belong to specified questionnaire');
    }

    if (question.questionnaire.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only update questions in your own courses');
    }

    this.validateOptions(dto.options, dto.type ?? question.type);
    if (dto.options && dto.position !== undefined && dto.position !== question.position) {
      throw new BadRequestException('Reorder and replace answers in separate requests');
    }

    if (dto.position !== undefined && dto.position !== question.position) {
      const targetPos = dto.position;

      await this.prisma.$transaction(async (tx) => {
        await tx.question.update({
          where: { id: questionId },
          data: { position: -1 },
        });

        if (targetPos > question.position) {
          const toShift = await tx.question.findMany({
            where: {
              questionnaireId,
              position: {
                gt: question.position,
                lte: targetPos,
              },
            },
            orderBy: { position: 'asc' },
          });

          for (const item of toShift) {
            await tx.question.update({
              where: { id: item.id },
              data: { position: item.position - 1 },
            });
          }
        } else {
          const toShift = await tx.question.findMany({
            where: {
              questionnaireId,
              position: {
                gte: targetPos,
                lt: question.position,
              },
            },
            orderBy: { position: 'desc' },
          });

          for (const item of toShift) {
            await tx.question.update({
              where: { id: item.id },
              data: { position: item.position + 1 },
            });
          }
        }

        await tx.question.update({
          where: { id: questionId },
          data: {
            text: dto.text ?? question.text,
            type: dto.type ?? question.type,
            explanation: dto.explanation !== undefined ? dto.explanation : question.explanation,
            position: targetPos,
          },
        });
      });

      return this.prisma.question.findUnique({
        where: { id: questionId },
        include: {
          options: {
            orderBy: { position: 'asc' },
          },
        },
      });
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: dto.text,
        type: dto.type,
        explanation: dto.explanation,
        ...(dto.options ? { options: { deleteMany: {}, create: dto.options.map((option, position) => ({ text: option.text.trim(), isCorrect: option.isCorrect ?? false, position })) } } : {}),
      },
      include: {
        options: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Delete a question from questionnaire
   */
  async removeQuestion(questionnaireId: string, questionId: string, userId: string) {
    const question = await this.resolveQuestionAuthor(questionId);

    if (question.questionnaireId !== questionnaireId) {
      throw new NotFoundException('Question does not belong to specified questionnaire');
    }

    if (question.questionnaire.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only delete questions in your own courses');
    }

    const deletedPos = question.position;

    await this.prisma.$transaction(async (tx) => {
      await tx.question.delete({
        where: { id: questionId },
      });

      const subsequent = await tx.question.findMany({
        where: {
          questionnaireId,
          position: { gt: deletedPos },
        },
        orderBy: { position: 'asc' },
      });

      for (const item of subsequent) {
        await tx.question.update({
          where: { id: item.id },
          data: { position: item.position - 1 },
        });
      }
    });

    return { message: 'Question deleted successfully', id: questionId };
  }

  /**
   * Add answer option to question
   */
  async addOption(questionId: string, dto: CreateOptionDto, userId: string) {
    const question = await this.resolveQuestionAuthor(questionId);

    if (question.questionnaire.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only add options to your own questions');
    }

    let targetPosition = dto.position;

    if (targetPosition === undefined || targetPosition === null) {
      const highest = await this.prisma.questionOption.findFirst({
        where: { questionId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      targetPosition = highest ? highest.position + 1 : 0;
    } else {
      const existingAtPos = await this.prisma.questionOption.findUnique({
        where: {
          questionId_position: {
            questionId,
            position: targetPosition,
          },
        },
      });

      if (existingAtPos) {
        await this.prisma.$transaction(async (tx) => {
          const toShift = await tx.questionOption.findMany({
            where: {
              questionId,
              position: { gte: targetPosition },
            },
            orderBy: { position: 'desc' },
          });

          for (const item of toShift) {
            await tx.questionOption.update({
              where: { id: item.id },
              data: { position: item.position + 1 },
            });
          }
        });
      }
    }

    return this.prisma.questionOption.create({
      data: {
        questionId,
        text: dto.text,
        isCorrect: dto.isCorrect ?? false,
        position: targetPosition,
      },
    });
  }

  /**
   * Update question option
   */
  async updateOption(
    questionId: string,
    optionId: string,
    dto: UpdateOptionDto,
    userId: string,
  ) {
    const option = await this.resolveOptionAuthor(optionId);

    if (option.questionId !== questionId) {
      throw new NotFoundException('Option does not belong to specified question');
    }

    if (option.question.questionnaire.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only update options in your own questions');
    }

    if (dto.position !== undefined && dto.position !== option.position) {
      const targetPos = dto.position;

      await this.prisma.$transaction(async (tx) => {
        await tx.questionOption.update({
          where: { id: optionId },
          data: { position: -1 },
        });

        if (targetPos > option.position) {
          const toShift = await tx.questionOption.findMany({
            where: {
              questionId,
              position: {
                gt: option.position,
                lte: targetPos,
              },
            },
            orderBy: { position: 'asc' },
          });

          for (const item of toShift) {
            await tx.questionOption.update({
              where: { id: item.id },
              data: { position: item.position - 1 },
            });
          }
        } else {
          const toShift = await tx.questionOption.findMany({
            where: {
              questionId,
              position: {
                gte: targetPos,
                lt: option.position,
              },
            },
            orderBy: { position: 'desc' },
          });

          for (const item of toShift) {
            await tx.questionOption.update({
              where: { id: item.id },
              data: { position: item.position + 1 },
            });
          }
        }

        await tx.questionOption.update({
          where: { id: optionId },
          data: {
            text: dto.text ?? option.text,
            isCorrect: dto.isCorrect !== undefined ? dto.isCorrect : option.isCorrect,
            position: targetPos,
          },
        });
      });

      return this.prisma.questionOption.findUnique({
        where: { id: optionId },
      });
    }

    return this.prisma.questionOption.update({
      where: { id: optionId },
      data: {
        text: dto.text,
        isCorrect: dto.isCorrect,
      },
    });
  }

  /**
   * Delete option from question
   */
  async removeOption(questionId: string, optionId: string, userId: string) {
    const option = await this.resolveOptionAuthor(optionId);

    if (option.questionId !== questionId) {
      throw new NotFoundException('Option does not belong to specified question');
    }

    if (option.question.questionnaire.session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only delete options in your own questions');
    }

    const deletedPos = option.position;

    await this.prisma.$transaction(async (tx) => {
      await tx.questionOption.delete({
        where: { id: optionId },
      });

      const subsequent = await tx.questionOption.findMany({
        where: {
          questionId,
          position: { gt: deletedPos },
        },
        orderBy: { position: 'asc' },
      });

      for (const item of subsequent) {
        await tx.questionOption.update({
          where: { id: item.id },
          data: { position: item.position - 1 },
        });
      }
    });

    return { message: 'Option deleted successfully', id: optionId };
  }

  // ─── Student Attempts & Scoring (Phase 6) ──────────────────────────────────

  /**
   * Start a new questionnaire attempt (or resume active one)
   */
  async startAttempt(questionnaireId: string, userId: string, dto?: StartAttemptDto) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            options: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                text: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    let validEnrollmentId: string | null = null;
    if (dto?.enrollmentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
      });
      if (enrollment && enrollment.userId === userId) {
        if (enrollment.status !== EnrollmentStatus.ACTIVE) {
          throw new BadRequestException('Enrollment is not active');
        }
        validEnrollmentId = enrollment.id;
      } else if (enrollment) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isPrivileged = user?.roles?.some((r) =>
          ['AUTHOR', 'MANAGER', 'SUPER_ADMIN'].includes(r),
        );
        if (!isPrivileged) {
          throw new ForbiddenException('Invalid enrollment');
        }
      }
    }

    if (questionnaire.maxAttempts > 0) {
      const submittedAttempts = await this.prisma.questionnaireAttempt.count({
        where: {
          questionnaireId,
          userId,
          status: AttemptStatus.SUBMITTED,
        },
      });
      if (submittedAttempts >= questionnaire.maxAttempts) {
        throw new BadRequestException(
          `Maximum attempt limit (${questionnaire.maxAttempts}) reached for this questionnaire`,
        );
      }
    }

    // Look for existing IN_PROGRESS attempt
    let attempt = await this.prisma.questionnaireAttempt.findFirst({
      where: {
        questionnaireId,
        userId,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: {
        answers: true,
      },
    });

    if (!attempt) {
      attempt = await this.prisma.questionnaireAttempt.create({
        data: {
          questionnaireId,
          userId,
          enrollmentId: validEnrollmentId,
          status: AttemptStatus.IN_PROGRESS,
        },
        include: {
          answers: true,
        },
      });
    }

    return {
      attemptId: attempt.id,
      questionnaireId: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      passingScore: questionnaire.passingScore,
      maxAttempts: questionnaire.maxAttempts,
      startedAt: attempt.startedAt,
      savedAnswers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionIds: a.selectedOptionIds,
      })),
      questions: questionnaire.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        position: q.position,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          position: opt.position,
        })),
      })),
    };
  }

  /**
   * Submit questionnaire attempt, calculate score, evaluate passing status, update progress & certificates
   */
  async submitAttempt(
    questionnaireId: string,
    attemptId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ) {
    const attempt = await this.prisma.questionnaireAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questionnaire: {
          include: {
            session: {
              include: {
                section: {
                  include: {
                    course: true,
                  },
                },
              },
            },
            questions: {
              orderBy: { position: 'asc' },
              include: {
                options: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Attempt belongs to another student');
    }

    if (attempt.questionnaireId !== questionnaireId) {
      throw new BadRequestException('Attempt does not match this questionnaire');
    }

    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new BadRequestException('This attempt has already been submitted');
    }

    const questionnaire = attempt.questionnaire;
    const questions = questionnaire.questions;
    let correctCount = 0;
    const answerRecords: {
      attemptId: string;
      questionId: string;
      selectedOptionIds: string[];
      isCorrect: boolean;
      pointsEarned: number;
    }[] = [];

    const reviewQuestions: any[] = [];

    for (const q of questions) {
      const userAns = dto.answers.find((a) => a.questionId === q.id);
      const selectedOptionIds = userAns ? userAns.selectedOptionIds : [];
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);

      // Exact match check
      const isCorrect =
        selectedOptionIds.length === correctOptionIds.length &&
        selectedOptionIds.every((id) => correctOptionIds.includes(id));

      if (isCorrect) {
        correctCount++;
      }

      answerRecords.push({
        attemptId: attempt.id,
        questionId: q.id,
        selectedOptionIds,
        isCorrect,
        pointsEarned: isCorrect ? 1 : 0,
      });

      reviewQuestions.push({
        questionId: q.id,
        text: q.text,
        type: q.type,
        explanation: q.explanation,
        isCorrect,
        selectedOptionIds,
        correctOptionIds,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          position: opt.position,
          isCorrect: opt.isCorrect,
        })),
      });
    }

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 100;
    const isPassed = scorePercentage >= questionnaire.passingScore;

    // Transaction to record answers and complete attempt
    await this.prisma.$transaction(async (tx) => {
      for (const ans of answerRecords) {
        await tx.questionnaireAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: ans.attemptId,
              questionId: ans.questionId,
            },
          },
          create: ans,
          update: {
            selectedOptionIds: ans.selectedOptionIds,
            isCorrect: ans.isCorrect,
            pointsEarned: ans.pointsEarned,
          },
        });
      }

      await tx.questionnaireAttempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.SUBMITTED,
          score: correctCount,
          totalScore: totalQuestions,
          scorePercentage,
          isPassed,
          submittedAt: new Date(),
        },
      });

      // If passed and an enrollment is tied to this attempt, mark session complete
      if (isPassed && attempt.enrollmentId) {
        await tx.sessionProgress.upsert({
          where: {
            enrollmentId_sessionId: {
              enrollmentId: attempt.enrollmentId,
              sessionId: questionnaire.sessionId,
            },
          },
          create: {
            enrollmentId: attempt.enrollmentId,
            sessionId: questionnaire.sessionId,
            completedAt: new Date(),
          },
          update: {
            completedAt: new Date(),
          },
        });
      }
    });

    // Check if course is 100% complete for certificate
    let certificate: any = null;
    if (isPassed && attempt.enrollmentId) {
      try {
        certificate = await this.certificatesService.issue(attempt.enrollmentId, userId);
      } catch (err) {
        // Ignored if course not yet 100% or certificate already issued
      }
    }

    // Audit log
    await this.auditLog.log({
      actorId: userId,
      action: AuditAction.QUESTIONNAIRE_ATTEMPT_SUBMITTED,
      entityType: 'QuestionnaireAttempt',
      entityId: attempt.id,
      metadata: {
        questionnaireId,
        score: correctCount,
        totalScore: totalQuestions,
        scorePercentage,
        isPassed,
      },
    });

    return {
      attemptId: attempt.id,
      questionnaireId,
      score: correctCount,
      totalScore: totalQuestions,
      scorePercentage,
      passingScore: questionnaire.passingScore,
      isPassed,
      submittedAt: new Date(),
      certificate: certificate ? { id: certificate.id, code: certificate.code } : null,
      review: reviewQuestions,
    };
  }

  /**
   * Get past attempts for a questionnaire by user
   */
  async getUserAttempts(questionnaireId: string, userId: string) {
    return this.prisma.questionnaireAttempt.findMany({
      where: {
        questionnaireId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        score: true,
        totalScore: true,
        scorePercentage: true,
        isPassed: true,
        startedAt: true,
        submittedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get details and review of a specific attempt
   */
  async getAttemptDetails(questionnaireId: string, attemptId: string, userId: string) {
    const attempt = await this.prisma.questionnaireAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        questionnaire: {
          include: {
            questions: {
              orderBy: { position: 'asc' },
              include: {
                options: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Attempt belongs to another student');
    }

    if (attempt.questionnaireId !== questionnaireId) {
      throw new BadRequestException('Attempt does not match this questionnaire');
    }

    const isSubmitted = attempt.status === AttemptStatus.SUBMITTED;

    return {
      attemptId: attempt.id,
      questionnaireId: attempt.questionnaireId,
      status: attempt.status,
      score: attempt.score,
      totalScore: attempt.totalScore,
      scorePercentage: attempt.scorePercentage,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      review: isSubmitted
        ? attempt.questionnaire.questions.map((q) => {
            const ans = attempt.answers.find((a) => a.questionId === q.id);
            return {
              questionId: q.id,
              text: q.text,
              type: q.type,
              explanation: q.explanation,
              isCorrect: ans?.isCorrect ?? false,
              selectedOptionIds: ans?.selectedOptionIds ?? [],
              options: q.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                position: opt.position,
                isCorrect: opt.isCorrect,
              })),
            };
          })
        : null,
    };
  }
}

