import { EducationProgramConfiguration } from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { DataSource } from "typeorm";

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
