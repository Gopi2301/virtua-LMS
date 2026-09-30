import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnairesService } from './questionnaires.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('QuestionnairesService', () => {
  let service: QuestionnairesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnairesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
