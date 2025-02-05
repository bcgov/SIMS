import {
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  InstitutionLocation,
  Student,
} from "@sims/sims-db";
import {
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
  createFakeStudent,
  saveFakeApplication,
} from "@sims/test-utils";
import { AESTGroups, getAESTUser } from "../../../testHelpers";
import { DataSource } from "typeorm";

/**
 * Create a fake application with an application exception associated.
 * @param dataSource application dataSource.
 * @param relations dependencies.
 * - `institutionLocation` related location.
 * @param options additional options.
 * - `applicationExceptionStatus` application exception status.
 *  @returns application with an application exception associated.
 */
export async function saveFakeApplicationWithApplicationException(
  dataSource: DataSource,
  relations?: {
    institutionLocation?: InstitutionLocation;
  },
  options?: {
    applicationExceptionStatus: ApplicationExceptionStatus;
  },
): Promise<Application> {
  const applicationRepo = dataSource.getRepository(Application);
  const applicationExceptionRepo =
    dataSource.getRepository(ApplicationException);
  const applicationExceptionRequestRepo = dataSource.getRepository(
    ApplicationExceptionRequest,
  );
  const studentRepo = dataSource.getRepository(Student);
  const assessedBy = await getAESTUser(
    dataSource,
    AESTGroups.BusinessAdministrators,
  );

  const student = await studentRepo.save(createFakeStudent());
  let applicationException = createFakeApplicationException({
    creator: student.user,
    assessedBy,
  });
  if (options?.applicationExceptionStatus) {
    applicationException.exceptionStatus = options?.applicationExceptionStatus;
  }
  applicationException = await applicationExceptionRepo.save(
    applicationException,
  );
  const application = await saveFakeApplication(dataSource, {
    student,
    applicationException,
    institutionLocation: relations?.institutionLocation,
  });

  await applicationExceptionRequestRepo.save(
    createFakeApplicationExceptionRequest({
      applicationException,
      creator: student.user,
    }),
  );

  return applicationRepo.findOne({
    relations: {
      applicationException: {
        exceptionNote: true,
        exceptionRequests: true,
        assessedBy: true,
      },
      student: true,
    },
    where: {
      id: application.id,
    },
  });
}
