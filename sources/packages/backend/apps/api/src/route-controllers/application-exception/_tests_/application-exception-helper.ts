import { TestingModule } from "@nestjs/testing";
import { SystemUsersService } from "@sims/services";
import {
  Application,
  ApplicationException,
  ApplicationExceptionStatus,
  Student,
} from "@sims/sims-db";
import {
  createFakeApplication,
  createFakeApplicationException,
  createFakeStudent,
} from "@sims/test-utils";
import { AESTGroups, getAESTUser } from "../../../testHelpers";
import { DataSource, Repository } from "typeorm";

/**
 * Create a fake application with an application exception associated.
 * @param applicationExceptionStatus application exception status.
 * @param dataSource application dataSource.
 * @param module application module.
 * @returns application with an application exception associated.
 */
export async function saveFakeApplicationWithApplicationException(
  applicationExceptionStatus: ApplicationExceptionStatus,
  dataSource: DataSource,
  module: TestingModule,
): Promise<Application> {
  const systemUsersService = await module.get(SystemUsersService);
  const applicationRepo = dataSource.getRepository(Application);
  const applicationExceptionRepo =
    dataSource.getRepository(ApplicationException);
  const studentRepo = dataSource.getRepository(Student);
  const creator = await systemUsersService.systemUser();
  const assessedBy = await getAESTUser(
    dataSource,
    AESTGroups.BusinessAdministrators,
  );

  let applicationException = createFakeApplicationException(
    applicationExceptionStatus,
    { creator, assessedBy },
  );
  applicationException = await applicationExceptionRepo.save(
    applicationException,
  );

  const student = await studentRepo.save(createFakeStudent());

  return applicationRepo.save(
    createFakeApplication({ student, applicationException }),
  );
}
