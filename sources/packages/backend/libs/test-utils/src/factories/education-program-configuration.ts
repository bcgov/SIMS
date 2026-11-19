import { EducationProgramConfiguration, ProgramYear } from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { DataSource } from "typeorm";

/**
 * Ensures an education program configuration exists for the program year,
 * checking by the program year and the active status.
 * If it does not exist, creates one copying the schemas from the most recent
 * active education program configuration and saves it.
 * Only one active configuration is allowed per program year, hence an existing
 * active configuration is always reused.
 * @param db e2e data sources.
 * @param programYear program year to be associated with the configuration.
 * @param options method options.
 * - `isActive` indicates if the configuration must be active. Defaults to true.
 * @returns the existing or created education program configuration.
 */
export async function ensureEducationProgramConfigurationExists(
  db: E2EDataSources,
  programYear: ProgramYear,
  options?: { isActive?: boolean },
): Promise<EducationProgramConfiguration> {
  const isActive = options?.isActive ?? true;
  const existingConfiguration = await db.educationProgramConfiguration.findOne({
    select: {
      id: true,
      visualSchema: true,
      validationSchema: true,
      isActive: true,
      programYear: { id: true, programYear: true, startDate: true },
    },
    relations: { programYear: true },
    where: { programYear: { id: programYear.id }, isActive },
  });
  if (existingConfiguration) {
    return existingConfiguration;
  }
  const mostRecentConfiguration =
    await getMostRecentEducationProgramConfiguration({ db });
  const configuration = new EducationProgramConfiguration();
  configuration.visualSchema = mostRecentConfiguration.visualSchema;
  configuration.validationSchema = mostRecentConfiguration.validationSchema;
  configuration.programYear = programYear;
  configuration.isActive = isActive;
  return db.educationProgramConfiguration.save(configuration);
}

/**
 * Retrieves the most recent active education program configuration from the specified data source.
 * @param options Options to specify the data source for retrieving the education program configuration.
 * @returns The most recent active education program configuration.
 */
export function getMostRecentEducationProgramConfiguration(options: {
  db?: E2EDataSources;
  dataSource?: DataSource;
}): Promise<EducationProgramConfiguration> {
  const educationProgramConfigurationRepo =
    options?.db?.educationProgramConfiguration ??
    options?.dataSource?.getRepository?.(EducationProgramConfiguration);
  return educationProgramConfigurationRepo.findOneOrFail({
    select: {
      id: true,
      visualSchema: true,
      validationSchema: true,
      updatedAt: true,
      programYear: {
        id: true,
        programYear: true,
        startDate: true,
      },
    },
    relations: {
      programYear: true,
    },
    where: { isActive: true },
    order: {
      programYear: { startDate: "DESC" },
    },
  });
}
