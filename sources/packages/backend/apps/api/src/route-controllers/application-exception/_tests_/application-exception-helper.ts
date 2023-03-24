import { TestingModule } from "@nestjs/testing";
import { SystemUsersService } from "@sims/services";
import {
  Application,
  ApplicationException,
  ApplicationExceptionStatus,
  Student,
  User,
} from "@sims/sims-db";
import {
  createFakeApplication,
  createFakeApplicationException,
  createFakeStudent,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";

/**
 * Create a fake application with an application exception associated.
 * @param applicationExceptionStatus application exception status.
 * @param dataSource application dataSource.
 * @param module application module.
 * @returns application with an application exception associated.
 */
export async function createFakeApplicationWithApplicationException(
  applicationExceptionStatus: ApplicationExceptionStatus,
  dataSource: DataSource,
  module: TestingModule,
): Promise<Application> {
  const systemUsersService = await module.get(SystemUsersService);
  const applicationRepo: Repository<Application> =
    dataSource.getRepository(Application);
  const applicationExceptionRepo =
    dataSource.getRepository(ApplicationException);
  const studentRepo: Repository<Student> = dataSource.getRepository(Student);
  const userRepo: Repository<User> = dataSource.getRepository(User);
  const creator = await systemUsersService.systemUser();
  const assessedBy = await userRepo.findOneBy({
    userName: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
  });

  // Create fake application exception.
  let applicationException = createFakeApplicationException(
    applicationExceptionStatus,
    { creator, assessedBy },
  );
  applicationException = await applicationExceptionRepo.save(
    applicationException,
  );

  // Create fake student.
  let student = createFakeStudent();
  student = await studentRepo.save(student);

  // Create fake application.
  const application = createFakeApplication();
  application.student = student;
  application.applicationException = applicationException;
  return applicationRepo.save(application);
}
