import { EducationProgramConfiguration } from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { DataSource } from "typeorm";

export async function getMostRecentEducationProgramConfiguration(options: {
  db?: E2EDataSources;
  dataSource?: DataSource;
}): Promise<EducationProgramConfiguration> {
  const dataSource =
    options?.db?.educationProgramConfiguration ??
    options?.dataSource?.getRepository?.(EducationProgramConfiguration);
  return dataSource.findOneOrFail({
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
