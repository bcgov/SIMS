import {
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  Student,
} from "@sims/sims-db";
import {
  createFakeApplication,
  createFakeApplicationException,
  createFakeApplicationExceptionRequest,
  createFakeStudent,
} from "@sims/test-utils";
import { AESTGroups, getAESTUser } from "../../../testHelpers";
import { DataSource } from "typeorm";

/**
 * Create a fake application with an application exception associated.
 * @param dataSource application dataSource.
 * @param applicationExceptionStatus application exception status.
 * @param creator user that will be assigned to application exception.
 * @returns application with an application exception associated.
 */
export async function saveFakeApplicationWithApplicationException(
  dataSource: DataSource,
  applicationExceptionStatus: ApplicationExceptionStatus,
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
  applicationException.exceptionStatus = applicationExceptionStatus;
  applicationException = await applicationExceptionRepo.save(
    applicationException,
  );

  const application = await applicationRepo.save(
    createFakeApplication({ student, applicationException }),
  );

  await applicationExceptionRequestRepo.save(
    createFakeApplicationExceptionRequest({
      applicationException,
      creator: student.user,
    }),
  );

  return await applicationRepo.findOne({
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
