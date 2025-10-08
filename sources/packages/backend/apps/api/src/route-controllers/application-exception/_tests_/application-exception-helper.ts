import {
  Application,
  ApplicationException,
  ApplicationExceptionRequestStatus,
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
    applicationExceptionStatus?: ApplicationExceptionStatus;
  },
): Promise<Application> {
  const applicationExceptionRepo =
    dataSource.getRepository(ApplicationException);
  const studentRepo = dataSource.getRepository(Student);
  const assessedBy = await getAESTUser(
    dataSource,
    AESTGroups.BusinessAdministrators,
  );

  const student = await studentRepo.save(createFakeStudent());
  const applicationException = createFakeApplicationException({
    creator: student.user,
    assessedBy,
  });
  if (options?.applicationExceptionStatus) {
    applicationException.exceptionStatus = options?.applicationExceptionStatus;
  }

  // Map to set the application exception request status based on the application exception status.
  const exceptionRequestStatusMap = {
    [ApplicationExceptionStatus.Pending]:
      ApplicationExceptionRequestStatus.Pending,
    [ApplicationExceptionStatus.Approved]:
      ApplicationExceptionRequestStatus.Approved,
    [ApplicationExceptionStatus.Declined]:
      ApplicationExceptionRequestStatus.Declined,
  };

  const applicationExceptionRequest = createFakeApplicationExceptionRequest(
    {
      applicationException,
      creator: student.user,
    },
    {
      initialData: {
        exceptionRequestStatus:
          exceptionRequestStatusMap[applicationException.exceptionStatus],
      },
    },
  );
  applicationException.exceptionRequests = [applicationExceptionRequest];
  await applicationExceptionRepo.save(applicationException);

  const application = await saveFakeApplication(dataSource, {
    student,
    applicationException,
    institutionLocation: relations?.institutionLocation,
  });
  return application;
}
