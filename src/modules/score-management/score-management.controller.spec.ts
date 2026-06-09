import { Test, TestingModule } from '@nestjs/testing';
import { ScoreManagementController } from './score-management.controller';
import { ScoreManagementService } from './score-management.service';

describe('ScoreManagementController', () => {
  let controller: ScoreManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoreManagementController],
      providers: [ScoreManagementService],
    }).compile();

    controller = module.get<ScoreManagementController>(ScoreManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
