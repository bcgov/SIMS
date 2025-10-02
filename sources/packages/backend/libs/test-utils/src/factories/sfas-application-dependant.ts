import { SFASApplication, SFASApplicationDependant } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { faker } from "@faker-js/faker";

/**
 * Create fake SFAS application dependant.
 * @param relations entity relations.
 * @param options SFAS application dependant options.
 * - `initialValues` SFAS application dependant initial values.
 * @returns sfas application dependant.
 */
export function createFakeSFASApplicationDependant(
  relations: { sfasApplication: SFASApplication },
  options?: {
    initialValues?: Partial<SFASApplicationDependant>;
  },
): SFASApplicationDependant {
  const sfasApplicationDependant = new SFASApplicationDependant();
  sfasApplicationDependant.id = faker.number.int({
    min: 100000000,
    max: 999999999,
  });
  sfasApplicationDependant.application = relations.sfasApplication;
  sfasApplicationDependant.dependantName =
    options?.initialValues?.dependantName ?? faker.person.firstName();
  sfasApplicationDependant.dependantBirthDate =
    options?.initialValues?.dependantBirthDate ??
    getISODateOnlyString(faker.date.past({ years: 18 }));
  sfasApplicationDependant.extractedAt = new Date();
  return sfasApplicationDependant;
}
