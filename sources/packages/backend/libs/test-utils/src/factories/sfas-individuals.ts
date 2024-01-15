import { SFASIndividual } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import * as faker from "faker";

/**
 * Create fake sfas individual.
 * @param options sfas individual options.
 * - `initialValues` sfas individual initial values.
 * @returns created sfas individual.
 */
function createFakeSFASIndividual(options?: {
  initialValues?: Partial<SFASIndividual>;
}) {
  const sfasIndividual = new SFASIndividual();
  sfasIndividual.id = faker.random.number({ min: 100000000, max: 999999999 });
  sfasIndividual.birthDate =
    options?.initialValues.birthDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasIndividual.lastName =
    options?.initialValues.lastName ?? faker.name.lastName();
  sfasIndividual.sin =
    options?.initialValues.sin ??
    faker.random.number({ min: 100000000, max: 899999999 }).toString();
  sfasIndividual.unsuccessfulCompletion =
    options?.initialValues.unsuccessfulCompletion ?? 0;
  sfasIndividual.neb = 0;
  sfasIndividual.bcgg = 0;
  sfasIndividual.lfp = 0;
  sfasIndividual.pal = 0;
  sfasIndividual.cmsOveraward = 0;
  sfasIndividual.cslOveraward = 0;
  sfasIndividual.bcslOveraward = 0;
  sfasIndividual.grantOveraward = 0;
  sfasIndividual.withdrawals = 0;
  sfasIndividual.extractedAt = new Date();
  return sfasIndividual;
}

/**
 * Create and save fake sfas individual.
 * @param dataSource data source to persist the sfas individual.
 * @param options sfas individual options.
 * - `initialValues` sfas individual initial values.
 * @returns persisted sfas individual.
 */
export async function saveFakeSFASIndividual(
  dataSource: DataSource,
  options?: { initialValues?: Partial<SFASIndividual> },
): Promise<SFASIndividual> {
  const sfasIndividualRepo = dataSource.getRepository(SFASIndividual);
  const sfasIndividual = await sfasIndividualRepo.save(
    createFakeSFASIndividual({ initialValues: options?.initialValues }),
  );
  return sfasIndividualRepo.save(sfasIndividual);
}
