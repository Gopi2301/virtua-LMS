import { Test, TestingModule } from '@nestjs/testing';
import { BundlesService } from './bundles.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('BundlesService', () => {
  let service: BundlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundlesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BundlesService>(BundlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
