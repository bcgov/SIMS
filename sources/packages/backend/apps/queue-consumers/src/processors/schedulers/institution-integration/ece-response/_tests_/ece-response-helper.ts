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
import { faker } from "@faker-js/faker";
import { IsNull } from "typeorm";

export const CONR_008_CONF_FILE = "CONR-008-CONF-20250502-144027.TXT";
export const CONR_008_DECL_FILE = "CONR-008-DECL-20250502-144027.TXT";
export const CONR_008_SKIP_FILE = "CONR-008-SKIP-20250502-144027.TXT";
export const CONR_008_FAIL_FILE = "CONR-008-FAIL-20250502-144027.TXT";
export const CONR_008_MULT_FILE = "CONR-008-MULT-20250502-144027.TXT";
export const CONR_008_VALD_FILE = "CONR-008-VALD-20250502-144027.TXT";
export const CONR_008_DBLO_FILE = "CONR-008-DBLO-20250502-144027.TXT";

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
  institutionLocationMULT: InstitutionLocation;
  institutionLocationVALD: InstitutionLocation;
  institutionLocationDBLO: InstitutionLocation;
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
  const institutionLocationVALD = await findOrCreateInstitutionLocation(
    institution,
    "VALD",
    e2eDataSources,
  );
  // Institution location to test disbursement with multiple detail records.
  const institutionLocationMULT = await findOrCreateInstitutionLocation(
    institution,
    "MULT",
    e2eDataSources,
    // Multiple integration contacts.
    {
      initialValues: {
        integrationContacts: [faker.internet.email(), faker.internet.email()],
      },
    },
  );
  const institutionLocationDBLO = await findOrCreateInstitutionLocation(
    institution,
    "DBLO",
    e2eDataSources,
  );

  return {
    institutionLocationCONF,
    institutionLocationDECL,
    institutionLocationSKIP,
    institutionLocationFAIL,
    institutionLocationMULT,
    institutionLocationVALD,
    institutionLocationDBLO,
  };
}

/**
 * Look for an existing institution location by institution code
 * if not found create one.
 * @param institution institution.
 * @param institutionCode institution code.
 * @param e2eDataSources e2e data sources.
 * @param options options.
 * - `initialValues` initial values of institution location.
 * @returns institution location.
 */
async function findOrCreateInstitutionLocation(
  institution: Institution,
  institutionCode: string,
  e2eDataSources: E2EDataSources,
  options?: { initialValues?: Partial<InstitutionLocation> },
): Promise<InstitutionLocation> {
  let institutionLocation = await e2eDataSources.institutionLocation.findOne({
    select: { id: true, institutionCode: true },
    where: { institutionCode },
  });
  if (!institutionLocation) {
    const newInstitutionLocation = createFakeInstitutionLocation({
      institution,
    });
    newInstitutionLocation.institutionCode = institutionCode;
    institutionLocation = newInstitutionLocation;
  }
  institutionLocation.integrationContacts = options?.initialValues
    .integrationContacts ?? [faker.internet.email()];
  return e2eDataSources.institutionLocation.save(institutionLocation);
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
  return e2eDataSources.notification.find({
    select: { id: true },
    where: {
      notificationMessage: {
        id: NotificationMessageType.ECEResponseFileProcessing,
      },
      dateSent: IsNull(),
    },
  });
}
