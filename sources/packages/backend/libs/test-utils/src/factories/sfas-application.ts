import { SFASApplication, SFASIndividual } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create fake SFAS application.
 * @param relations dependencies.
 * - `SFASIndividual` related SFAS individual.
 * @param options SFAS application options.
 * - `initialValues` SFAS application initial values.
 * @returns persisted SFAS application.
 */
export function createFakeSFASApplication(
  relations: { individual: SFASIndividual },
  options?: {
    initialValues?: Partial<SFASApplication>;
  },
): SFASApplication {
  const sfasApplication = new SFASApplication();
  sfasApplication.id = faker.datatype.number({
    min: 100000000,
    max: 999999999,
  });
  sfasApplication.startDate =
    options?.initialValues.startDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasApplication.endDate =
    options?.initialValues.endDate ?? getISODateOnlyString(faker.date.past(18));
  sfasApplication.individual = relations.individual;
  sfasApplication.bslAward = options?.initialValues.bslAward ?? 20;
  sfasApplication.cslAward = options?.initialValues.cslAward ?? 20;
  sfasApplication.bcagAward = options?.initialValues.bcagAward ?? 0;
  sfasApplication.bgpdAward = options?.initialValues.bgpdAward ?? 0;
  sfasApplication.csfgAward = options?.initialValues.csfgAward ?? 0;
  sfasApplication.csgtAward = options?.initialValues.csgtAward ?? 0;
  sfasApplication.csgdAward = options?.initialValues.csgdAward ?? 0;
  sfasApplication.csgpAward = options?.initialValues.csgpAward ?? 0;
  sfasApplication.sbsdAward = options?.initialValues.sbsdAward ?? 0;
  sfasApplication.createdAt = faker.date.past(18);
  sfasApplication.updatedAt = faker.date.past(18);
  sfasApplication.extractedAt = faker.date.past(18);
  return sfasApplication;
}
