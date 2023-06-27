import {
  ApplicationOfferingChangeRequest,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  EducationProgramOffering,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import { saveFakeApplicationDisbursements } from "./application";
import { DataSource } from "typeorm";
import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeUser } from "./user";
import * as faker from "faker";

/**
 * Create and save a fake application offering request change record.
 * @param dataSource manages the repositories to save the data.
 * @param relations dependencies:
 * - `institutionLocation` related location.
 * @param options additional options:
 * - `applicationOfferingChangeRequestStatus` application offering change request status.
 * @returns created and saved application offering request change record.
 */
export async function saveFakeApplicationOfferingRequestChange(
  dataSource: DataSource,
  relations?: {
    institutionLocation?: InstitutionLocation;
  },
  options?: {
    applicationOfferingChangeRequestStatus?: ApplicationOfferingChangeRequestStatus;
  },
): Promise<ApplicationOfferingChangeRequest> {
  const userRepo = dataSource.getRepository(User);
  const savedUser = await userRepo.save(createFakeUser());

  const applicationOfferingChangeRequestRepo = dataSource.getRepository(
    ApplicationOfferingChangeRequest,
  );
  const offeringRepo = dataSource.getRepository(EducationProgramOffering);
  const requestedOffering = await offeringRepo.save(
    createFakeEducationProgramOffering({
      ...relations,
      auditUser: savedUser,
    }),
  );
  const application = await saveFakeApplicationDisbursements(
    dataSource,
    relations,
    {
      applicationStatus: ApplicationStatus.Completed,
    },
  );

  const applicationOfferingChangeRequest =
    new ApplicationOfferingChangeRequest();
  applicationOfferingChangeRequest.application = application;
  applicationOfferingChangeRequest.requestedOffering = requestedOffering;
  applicationOfferingChangeRequest.activeOffering =
    application.currentAssessment.offering;
  applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus =
    options?.applicationOfferingChangeRequestStatus ??
    ApplicationOfferingChangeRequestStatus.InProgressWithStudent;
  applicationOfferingChangeRequest.reason = faker.lorem.sentence();

  return applicationOfferingChangeRequestRepo.save(
    applicationOfferingChangeRequest,
  );
}
