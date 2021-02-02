import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, StudentService, UserService } from '../../services';
import { StudentController } from './student.controller';
import { DatabaseModule } from '../../database/database.module';

describe('StudentController', () => {
  let controller: StudentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [StudentService, AuthService, UserService],
      controllers: [StudentController],
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
