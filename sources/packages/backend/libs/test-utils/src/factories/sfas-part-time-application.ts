import { SFASIndividual, SFASPartTimeApplications } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create and save fake SFAS part time application.
 * @param relations dependencies.
 * - `SFASIndividual` related SFAS individual.
 * @param options SFAS part time application options.
 * - `initialValues` SFAS part time application initial values.
 * @returns persisted SFAS part time application.
 */
export function createFakeSFASPartTimeApplication(
  relations: { individual: SFASIndividual },
  options?: {
    initialValues?: Partial<SFASPartTimeApplications>;
  },
): SFASPartTimeApplications {
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
  sfasPartTimeApplication.individualId = relations.individual.id;
  sfasPartTimeApplication.startDate =
    options?.initialValues.startDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasPartTimeApplication.endDate =
    options?.initialValues.endDate ?? getISODateOnlyString(faker.date.past(18));
  sfasPartTimeApplication.cslpAward = options?.initialValues.cslpAward ?? 0;
  sfasPartTimeApplication.csgpAward = options?.initialValues.csgpAward ?? 0;
  sfasPartTimeApplication.sbsdAward = options?.initialValues.sbsdAward ?? 0;
  sfasPartTimeApplication.csptAward = options?.initialValues.csptAward ?? 0;
  sfasPartTimeApplication.csgdAward = options?.initialValues.csgdAward ?? 0;
  sfasPartTimeApplication.bcagAward = options?.initialValues.bcagAward ?? 0;
  sfasPartTimeApplication.createdAt = faker.date.past(18);
  sfasPartTimeApplication.updatedAt = faker.date.past(18);
  sfasPartTimeApplication.extractedAt = faker.date.past(18);
  sfasPartTimeApplication.applicationCancelDate =
    options?.initialValues?.applicationCancelDate;
  return sfasPartTimeApplication;
}
