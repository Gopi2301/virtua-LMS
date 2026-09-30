import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOptionDto,
  CreateQuestionDto,
  CreateQuestionnaireDto,
  UpdateOptionDto,
  UpdateQuestionDto,
  UpdateQuestionnaireDto,
} from './dto';

@Injectable()
export class QuestionnairesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
