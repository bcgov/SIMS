import {
  Institution,
  InstitutionLocation,
  Notification,
  NotificationMessageType,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createFakeInstitution,
  createFakeInstitutionLocation,
} from "@sims/test-utils";
import * as faker from "faker";
import { IsNull } from "typeorm";

/**
 * Create institution locations to be used for testing.
 * @param e2eDataSources e2e data sources.
 * @returns institution locations.
 */
export async function createInstitutionLocations(
  e2eDataSources: E2EDataSources,
): Promise<{
  institutionLocationCONF: InstitutionLocation;
  institutionLocationDECL: InstitutionLocation;
  institutionLocationSKIP: InstitutionLocation;
  institutionLocationFAIL: InstitutionLocation;
}> {
  const institution = await e2eDataSources.institution.save(
    createFakeInstitution(),
  );
  const institutionLocationCONF = await findOrCreateInstitutionLocation(
    institution,
    "CONF",
    e2eDataSources,
  );
  const institutionLocationDECL = await findOrCreateInstitutionLocation(
    institution,
    "DECL",
    e2eDataSources,
  );

  const institutionLocationSKIP = await findOrCreateInstitutionLocation(
    institution,
    "SKIP",
    e2eDataSources,
  );

  const institutionLocationFAIL = await findOrCreateInstitutionLocation(
    institution,
    "FAIL",
    e2eDataSources,
  );

  return {
    institutionLocationCONF,
    institutionLocationDECL,
    institutionLocationSKIP,
    institutionLocationFAIL,
  };
}

/**
 * Look for an existing institution location by institution code
 * if not found create one.
 * @param institution institution.
 * @param institutionCode institution code.
 * @param e2eDataSources e2e data sources.
 * @returns institution location.
 */
async function findOrCreateInstitutionLocation(
  institution: Institution,
  institutionCode: string,
  e2eDataSources: E2EDataSources,
): Promise<InstitutionLocation> {
  let institutionLocation = await e2eDataSources.institutionLocation.findOne({
    select: { id: true, institutionCode: true },
    where: { institutionCode },
  });
  if (!institutionLocation) {
    const newInstitutionLocation = createFakeInstitutionLocation(institution);
    newInstitutionLocation.institutionCode = institutionCode;
    institutionLocation = newInstitutionLocation;
  }
  institutionLocation.integrationContacts = [faker.internet.email()];
  return await e2eDataSources.institutionLocation.save(institutionLocation);
}

/**
 * Enable integration for the given institution location.
 * @param institutionLocation institution location.
 * @param e2eDataSources e2e data sources.
 */
export async function enableIntegration(
  institutionLocation: InstitutionLocation,
  e2eDataSources: E2EDataSources,
): Promise<void> {
  await e2eDataSources.institutionLocation.update(
    {
      id: institutionLocation.id,
    },
    { hasIntegration: true },
  );
}

/**
 * Get all unsent ECE Response notifications.
 * @param e2eDataSources e2e data sources.
 * @returns Unsent ECE Response notifications.
 */
export async function getUnsentECEResponseNotifications(
  e2eDataSources: E2EDataSources,
): Promise<Notification[]> {
  return await e2eDataSources.notification.find({
    select: { id: true },
    where: {
      notificationMessage: {
        id: NotificationMessageType.ECEResponseFileProcessing,
      },
      dateSent: IsNull(),
    },
  });
}
