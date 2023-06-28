import {
  ApplicationOfferingChangeRequest,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  InstitutionLocation,
} from "@sims/sims-db";
import { saveFakeApplicationDisbursements } from "./application";
import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeUser } from "./user";
import * as faker from "faker";
import { E2EDataSources } from "../data-source/e2e-data-source";

/**
 * Create and save a fake application offering request change record.
 * @param db manages the repositories to save the data.
 * @param relations dependencies:
 * - `institutionLocation` related location.
 * @param options additional options:
 * - `applicationOfferingChangeRequestStatus` application offering change request status.
 * @returns created and saved application offering request change record.
 */
export async function saveFakeApplicationOfferingRequestChange(
  db: E2EDataSources,
  relations?: {
    institutionLocation?: InstitutionLocation;
  },
  options?: {
    initialValues: Partial<ApplicationOfferingChangeRequest>;
  },
): Promise<ApplicationOfferingChangeRequest> {
  const savedUser = await db.user.save(createFakeUser());
  const requestedOffering = await db.educationProgramOffering.save(
    createFakeEducationProgramOffering({
      ...relations,
      auditUser: savedUser,
    }),
  );
  const application = await saveFakeApplicationDisbursements(
    db.dataSource,
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
    options?.initialValues.applicationOfferingChangeRequestStatus ??
    ApplicationOfferingChangeRequestStatus.InProgressWithStudent;
  applicationOfferingChangeRequest.reason = faker.lorem.sentence(3);

  return db.applicationOfferingChangeRequest.save(
    applicationOfferingChangeRequest,
  );
}
