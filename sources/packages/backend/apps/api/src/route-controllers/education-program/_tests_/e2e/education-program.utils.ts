import { faker } from "@faker-js/faker";
import {
  EducationProgramConfiguration,
  ProgramIntensity,
  ProgramYear,
  FormYesNoOptions,
} from "@sims/sims-db";
import {
  E2EDataSources,
  ensureEducationProgramConfigurationExists,
  ensureProgramYearExists,
  ensureSequentialProgramYearsExist,
} from "@sims/test-utils";
import { OTHER_REGULATORY_BODY } from "../../../../services/education-program/constants";
import {
  EducationProgramDynamicData,
  EntranceRequirementValues,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
} from "../../../../services";
import {
  CreateEducationProgramAPIInDTO,
  UpdateEducationProgramAPIInDTO,
} from "../../models/education-program.dto";

/**
 * Program year prefixes reserved for e2e tests that need full control over the
 * program configurations of a program year (e.g. "next program year" resolution
 * for renewals) without affecting other tests running in parallel.
 * Past years are used to avoid interfering with tests relying on the most recent
 * active education program configuration.
 * Check here before reserving a new year, keeping the entries sorted.
 * Entries that start a sequence of consecutive program years state how many
 * years they take.
 * Note: 1999 is also taken by ensureProgramYearExistsForPartTimeOnly from test-utils.
 */
const E2E_PROGRAM_YEAR_PREFIX = {
  /**
   * Renewal available (2 years: 1950-1951).
   */
  RenewProgramGetAvailable: 1950,
  /**
   * Program year with an active and an inactive configuration.
   */
  UpdateProgramGetActiveConfiguration: 1955,
  /**
   * Program year with only an inactive configuration.
   */
  UpdateProgramGetNoActiveConfiguration: 1956,
  /**
   * Program year with an active and an inactive configuration.
   */
  UpdateProgramActiveConfiguration: 1957,
  /**
   * Program year with only an inactive configuration.
   */
  UpdateProgramNoActiveConfiguration: 1958,
  /**
   * Renewal not available (2 years: 1960-1961).
   */
  RenewProgramGetNotAvailable: 1960,
  /**
   * Program year with an active configuration.
   */
  ProgramYearsListActiveConfiguration: 1970,
  /**
   * Program year with only an inactive configuration.
   */
  ProgramYearsListInactiveConfiguration: 1971,
  /**
   * Program year without any configuration.
   */
  ProgramYearsListNoConfiguration: 1972,
  /**
   * Program year with an inactive configuration.
   */
  CreateProgramInactiveConfiguration: 1980,
  /**
   * Renewal available (2 years: 1985-1986).
   */
  ProgramsForProgramYearRenewalAvailable: 1985,
  /**
   * Renewal not available (2 years: 1987-1988).
   */
  ProgramsForProgramYearRenewalNotAvailable: 1987,
  /**
   * Renewal chain (3 years: 1990-1992).
   */
  RenewProgramChain: 1990,
  /**
   * Renewal not available (2 years: 1995-1996).
   */
  RenewProgramNotAvailable: 1995,
} as const;

/**
 * Program configurations to test the renewal status, where the program
 * can only be renewed if the next program year has an active configuration.
 */
interface RenewalStatusProgramConfigurations {
  /**
   * Inactive configuration of the program year from which the program can be renewed.
   */
  renewableProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the program year immediately after the renewable one.
   */
  nextProgramConfiguration: EducationProgramConfiguration;
  /**
   * Inactive configuration of the program year whose next program year has
   * only an inactive configuration.
   */
  notRenewableProgramConfiguration: EducationProgramConfiguration;
}

/**
 * Program configurations to test the program update, where the active
 * configuration of the program year is expected for a full update.
 */
interface UpdateProgramConfigurations {
  /**
   * Inactive configuration of a program year that also has an active configuration.
   */
  outdatedProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the same program year as the outdated configuration.
   */
  activeProgramConfiguration: EducationProgramConfiguration;
  /**
   * Inactive configuration of a program year without an active configuration.
   */
  noActiveProgramConfiguration: EducationProgramConfiguration;
}

/**
 * Ensures the program configurations for the getEducationProgramConfigurationForUpdate e2e tests.
 * @param db e2e data sources.
 * @returns program configurations to test the program update.
 */
export function ensureGetEducationProgramForUpdateConfigurations(
  db: E2EDataSources,
): Promise<UpdateProgramConfigurations> {
  return ensureUpdateProgramConfigurations(
    db,
    E2E_PROGRAM_YEAR_PREFIX.UpdateProgramGetActiveConfiguration,
    E2E_PROGRAM_YEAR_PREFIX.UpdateProgramGetNoActiveConfiguration,
  );
}

/**
 * Ensures the program configurations for the updateEducationProgram e2e tests.
 * @param db e2e data sources.
 * @returns program configurations to test the program update.
 */
export function ensureUpdateEducationProgramConfigurations(
  db: E2EDataSources,
): Promise<UpdateProgramConfigurations> {
  return ensureUpdateProgramConfigurations(
    db,
    E2E_PROGRAM_YEAR_PREFIX.UpdateProgramActiveConfiguration,
    E2E_PROGRAM_YEAR_PREFIX.UpdateProgramNoActiveConfiguration,
  );
}

/**
 * Ensures the program configurations for the getEducationProgramForRenew e2e tests.
 * @param db e2e data sources.
 * @returns program configurations to test the renewal status.
 */
export function ensureGetEducationProgramForRenewConfigurations(
  db: E2EDataSources,
): Promise<RenewalStatusProgramConfigurations> {
  return ensureRenewalStatusProgramConfigurations(
    db,
    E2E_PROGRAM_YEAR_PREFIX.RenewProgramGetAvailable,
    E2E_PROGRAM_YEAR_PREFIX.RenewProgramGetNotAvailable,
  );
}

/**
 * Ensures the program configurations for the getProgramsForProgramYear e2e tests.
 * @param db e2e data sources.
 * @returns program configurations to test the renewal status.
 */
export function ensureGetProgramsForProgramYearConfigurations(
  db: E2EDataSources,
): Promise<RenewalStatusProgramConfigurations> {
  return ensureRenewalStatusProgramConfigurations(
    db,
    E2E_PROGRAM_YEAR_PREFIX.ProgramsForProgramYearRenewalAvailable,
    E2E_PROGRAM_YEAR_PREFIX.ProgramsForProgramYearRenewalNotAvailable,
  );
}

/**
 * Ensures the program configurations for the renewEducationProgram e2e tests.
 * - Renewal chain: three consecutive program years where each one (except the
 * first) has an active configuration, allowing a program to be renewed twice.
 * - Renewal not available: two consecutive program years where the next program
 * year has only an inactive configuration.
 * @param db e2e data sources.
 * @returns program configurations for the renewal chain and the renewal not available.
 */
export async function ensureRenewEducationProgramConfigurations(
  db: E2EDataSources,
): Promise<{
  firstProgramConfiguration: EducationProgramConfiguration;
  secondProgramConfiguration: EducationProgramConfiguration;
  thirdProgramConfiguration: EducationProgramConfiguration;
  notRenewableProgramConfiguration: EducationProgramConfiguration;
}> {
  const [
    [
      firstProgramConfiguration,
      secondProgramConfiguration,
      thirdProgramConfiguration,
    ],
    [notRenewableProgramConfiguration],
  ] = await Promise.all([
    ensureSequentialProgramConfigurations(
      db,
      E2E_PROGRAM_YEAR_PREFIX.RenewProgramChain,
      [{ isActive: false }, { isActive: true }, { isActive: true }],
    ),
    ensureSequentialProgramConfigurations(
      db,
      E2E_PROGRAM_YEAR_PREFIX.RenewProgramNotAvailable,
      [{ isActive: false }, { isActive: false }],
    ),
  ]);
  return {
    firstProgramConfiguration,
    secondProgramConfiguration,
    thirdProgramConfiguration,
    notRenewableProgramConfiguration,
  };
}

/**
 * Ensures the program configuration for the createEducationProgram e2e tests.
 * @param db e2e data sources.
 * @returns inactive configuration, the only one associated with its program year.
 */
export async function ensureCreateEducationProgramInactiveConfiguration(
  db: E2EDataSources,
): Promise<EducationProgramConfiguration> {
  const [inactiveProgramConfiguration] =
    await ensureSequentialProgramConfigurations(
      db,
      E2E_PROGRAM_YEAR_PREFIX.CreateProgramInactiveConfiguration,
      [{ isActive: false }],
    );
  return inactiveProgramConfiguration;
}

/**
 * Ensures the program years and their program configurations for the
 * getProgramYearsList e2e tests.
 * @param db e2e data sources.
 * @returns program years with different program configuration setups.
 */
export async function ensureGetProgramYearsListProgramYears(
  db: E2EDataSources,
): Promise<{
  /**
   * Program year with an active and an inactive program configuration.
   */
  activeConfigurationProgramYear: ProgramYear;
  /**
   * Program year with only an inactive program configuration.
   */
  inactiveConfigurationProgramYear: ProgramYear;
  /**
   * Program year without any program configuration.
   */
  noConfigurationProgramYear: ProgramYear;
}> {
  const [
    activeConfigurationProgramYear,
    inactiveConfigurationProgramYear,
    noConfigurationProgramYear,
  ] = await Promise.all([
    ensureProgramYearExists(
      db,
      E2E_PROGRAM_YEAR_PREFIX.ProgramYearsListActiveConfiguration,
    ),
    ensureProgramYearExists(
      db,
      E2E_PROGRAM_YEAR_PREFIX.ProgramYearsListInactiveConfiguration,
    ),
    ensureProgramYearExists(
      db,
      E2E_PROGRAM_YEAR_PREFIX.ProgramYearsListNoConfiguration,
    ),
  ]);
  await Promise.all([
    ensureEducationProgramConfigurationExists(
      db,
      activeConfigurationProgramYear,
    ),
    ensureEducationProgramConfigurationExists(
      db,
      activeConfigurationProgramYear,
      { isActive: false },
    ),
    ensureEducationProgramConfigurationExists(
      db,
      inactiveConfigurationProgramYear,
      { isActive: false },
    ),
  ]);
  return {
    activeConfigurationProgramYear,
    inactiveConfigurationProgramYear,
    noConfigurationProgramYear,
  };
}

/**
 * Ensures the program configurations to test the renewal status.
 * @param db e2e data sources.
 * @param renewalAvailablePrefix prefix of the first of two consecutive program
 * years where the next program year has an active configuration.
 * @param renewalNotAvailablePrefix prefix of the first of two consecutive program
 * years where the next program year has only an inactive configuration.
 * @returns program configurations to test the renewal status.
 */
async function ensureRenewalStatusProgramConfigurations(
  db: E2EDataSources,
  renewalAvailablePrefix: number,
  renewalNotAvailablePrefix: number,
): Promise<RenewalStatusProgramConfigurations> {
  const [
    [renewableProgramConfiguration, nextProgramConfiguration],
    [notRenewableProgramConfiguration],
  ] = await Promise.all([
    ensureSequentialProgramConfigurations(db, renewalAvailablePrefix, [
      { isActive: false },
      { isActive: true },
    ]),
    ensureSequentialProgramConfigurations(db, renewalNotAvailablePrefix, [
      { isActive: false },
      { isActive: false },
    ]),
  ]);
  return {
    renewableProgramConfiguration,
    nextProgramConfiguration,
    notRenewableProgramConfiguration,
  };
}

/**
 * Ensures the program configurations to test the program update.
 * @param db e2e data sources.
 * @param activeConfigurationPrefix prefix of the program year with an active
 * and an inactive configuration.
 * @param noActiveConfigurationPrefix prefix of the program year with only an
 * inactive configuration.
 * @returns program configurations to test the program update.
 */
async function ensureUpdateProgramConfigurations(
  db: E2EDataSources,
  activeConfigurationPrefix: number,
  noActiveConfigurationPrefix: number,
): Promise<UpdateProgramConfigurations> {
  const [activeConfigurationProgramYear, noActiveConfigurationProgramYear] =
    await Promise.all([
      ensureProgramYearExists(db, activeConfigurationPrefix),
      ensureProgramYearExists(db, noActiveConfigurationPrefix),
    ]);
  const [
    outdatedProgramConfiguration,
    activeProgramConfiguration,
    noActiveProgramConfiguration,
  ] = await Promise.all([
    ensureEducationProgramConfigurationExists(
      db,
      activeConfigurationProgramYear,
      { isActive: false },
    ),
    ensureEducationProgramConfigurationExists(
      db,
      activeConfigurationProgramYear,
    ),
    ensureEducationProgramConfigurationExists(
      db,
      noActiveConfigurationProgramYear,
      { isActive: false },
    ),
  ]);
  return {
    outdatedProgramConfiguration,
    activeProgramConfiguration,
    noActiveProgramConfiguration,
  };
}

/**
 * Ensures consecutive program years exist starting from the provided prefix,
 * each one with an education program configuration with the provided options.
 * @param db e2e data sources.
 * @param startingPrefix prefix of the first program year.
 * @param configurationsOptions options for each program year configuration, in order.
 * The number of items defines the number of consecutive program years.
 * - `isActive` indicates if the configuration must be active.
 * @returns configurations ordered by program year, including the program year relation.
 */
async function ensureSequentialProgramConfigurations(
  db: E2EDataSources,
  startingPrefix: number,
  configurationsOptions: { isActive: boolean }[],
): Promise<EducationProgramConfiguration[]> {
  const programYears = await ensureSequentialProgramYearsExist(
    db,
    startingPrefix,
    configurationsOptions.length,
  );
  return Promise.all(
    programYears.map((programYear, index) =>
      ensureEducationProgramConfigurationExists(
        db,
        programYear,
        configurationsOptions[index],
      ),
    ),
  );
}

/**
 * Get the payload for updating an education program.
 * @param programConfigurationId ID of the program configuration for which the education program is being updated.
 * @param options Options to customize the update payload.
 * - `appendedProgramData` Additional program data to append to the payload.
 * @returns The update payload for the education program.
 */
export function getUpdatePayload(
  programConfigurationId: number,
  options?: {
    appendedProgramData?: { [key: string]: unknown };
  },
): UpdateEducationProgramAPIInDTO & {
  programData: EducationProgramDynamicData;
} {
  return {
    programConfigurationId,
    programData: getProgramDataPayload(options),
  };
}

/**
 * Dynamic data required to create an education program.
 * @param programConfigurationId ID of the program configuration for which the education program is being created.
 * @param options Options to customize the creation payload.
 * - `appendedProgramData` Additional program data to append to the payload.
 * @returns The creation payload for the education program.
 */
export function getCreationPayload(
  programConfigurationId: number,
  options?: {
    appendedProgramData?: { [key: string]: unknown };
  },
): CreateEducationProgramAPIInDTO & {
  programData: EducationProgramDynamicData;
} {
  return {
    programConfigurationId,
    programData: getProgramDataPayload(options),
  };
}

/**
 * Get the dynamic program data payload for creating or updating an education program.
 * @param options Options to customize the program data payload.
 * - `appendedProgramData` Additional program data to append to the payload.
 * @returns The dynamic program data payload for the education program.
 */
function getProgramDataPayload(options?: {
  appendedProgramData?: { [key: string]: unknown };
}): EducationProgramDynamicData {
  return {
    programName: faker.lorem.words(5),
    programDescription: faker.lorem.words(5),
    credentialType: "undergraduateCertificate",
    cipCode: "11.1111",
    nocCode: "21740",
    fieldOfStudyCode: 15,
    sabcCode: `${faker.string.alpha({ length: 3, casing: "upper" })}1`,
    institutionProgramCode: faker.string.alpha({
      length: 3,
      casing: "upper",
    }),
    programIntensity: ProgramIntensity.fullTimePartTime,
    programDeliveryTypes: [ProgramDeliveryTypeValues.Onsite],
    completionYears: "12WeeksTo52Weeks",
    courseLoadCalculation: ProgramCourseLoadCalculationTypes.Credit,
    regulatoryBody: OTHER_REGULATORY_BODY,
    otherRegulatoryBody: "Other RB test",
    entranceRequirements: [
      EntranceRequirementValues.MinHighSchool,
      EntranceRequirementValues.HasMinimumAge,
      EntranceRequirementValues.RequirementsByInstitution,
      EntranceRequirementValues.RequirementsByBCITA,
    ],
    isAviationProgram: FormYesNoOptions.No,
    eslEligibility: ProgramESLPercentage.LessThan20,
    hasJointInstitution: FormYesNoOptions.No,
    hasWILComponent: FormYesNoOptions.No,
    hasTravel: FormYesNoOptions.No,
    hasIntlExchange: FormYesNoOptions.No,
    programDeclaration: true,
    ...options?.appendedProgramData,
  };
}
