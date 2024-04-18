import { SFASPartTimeApplications } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import * as faker from "faker";

/**
 * Create and save fake SFAS part time application.
 * @param dataSource data source to persist the SFAS part time application.
 * @param options SFAS part time application options.
 * - `initialValues` SFAS part time application initial values.
 * @returns persisted SFAS part time application.
 */
export async function saveFakeSFASPartTimeApplication(
  dataSource: DataSource,
  options?: {
    initialValues?: Partial<SFASPartTimeApplications>;
  },
): Promise<SFASPartTimeApplications> {
  const sfasPartTimeApplicationRepo = dataSource.getRepository(
    SFASPartTimeApplications,
  );
  const sfasPartTimeApplication = new SFASPartTimeApplications();
  sfasPartTimeApplication.id =
    faker.datatype.number({
      min: 2000,
      max: 2999,
    }) +
    "P" +
    faker.datatype.number({
      min: 2000,
      max: 29999,
    });
  sfasPartTimeApplication.individualId =
    options?.initialValues.individualId ?? 1;
  sfasPartTimeApplication.startDate =
    options?.initialValues.startDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasPartTimeApplication.endDate =
    options?.initialValues.endDate ?? getISODateOnlyString(faker.date.past(18));
  sfasPartTimeApplication.programYearId =
    options?.initialValues.programYearId ?? 20232024;
  sfasPartTimeApplication.cslpAward = options?.initialValues.cslpAward ?? 0;
  sfasPartTimeApplication.csgpAward = options?.initialValues.csgpAward ?? 0;
  sfasPartTimeApplication.sbsdAward = options?.initialValues.sbsdAward ?? 0;
  sfasPartTimeApplication.csptAward = options?.initialValues.csptAward ?? 0;
  sfasPartTimeApplication.csgdAward = options?.initialValues.csgdAward ?? 0;
  sfasPartTimeApplication.bcagAward = options?.initialValues.bcagAward ?? 0;
  sfasPartTimeApplication.createdAt = faker.date.past(18);
  sfasPartTimeApplication.updatedAt = faker.date.past(18);
  sfasPartTimeApplication.extractedAt = faker.date.past(18);
  return sfasPartTimeApplicationRepo.save(sfasPartTimeApplication);
}
