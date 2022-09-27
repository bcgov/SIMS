import { Test, TestingModule } from '@nestjs/testing';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

describe('WorkersController', () => {
  let workersController: WorkersController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WorkersController],
      providers: [WorkersService],
    }).compile();

    workersController = app.get<WorkersController>(WorkersController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(workersController.getHello()).toBe('Hello World!');
    });
  });
});
