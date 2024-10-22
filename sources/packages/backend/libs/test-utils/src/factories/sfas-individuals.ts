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
  const fakeMSFAANumber = faker.datatype
    .number({
      min: 1000000000,
      max: 9999999999,
    })
    .toString();
  const sfasIndividual = new SFASIndividual();
  sfasIndividual.id =
    options?.initialValues?.id ??
    faker.datatype.number({ min: 100000000, max: 999999999 });
  sfasIndividual.birthDate =
    options?.initialValues?.birthDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasIndividual.msfaaNumber =
    options?.initialValues?.msfaaNumber ?? fakeMSFAANumber;
  sfasIndividual.partTimeMSFAANumber =
    options?.initialValues?.partTimeMSFAANumber ?? fakeMSFAANumber;
  sfasIndividual.lastName =
    options?.initialValues?.lastName ?? faker.name.lastName();
  sfasIndividual.sin =
    options?.initialValues?.sin ??
    faker.datatype.number({ min: 100000000, max: 899999999 }).toString();
  sfasIndividual.unsuccessfulCompletion =
    options?.initialValues?.unsuccessfulCompletion ?? 0;
  sfasIndividual.neb = options?.initialValues?.neb ?? 0;
  sfasIndividual.bcgg = options?.initialValues?.bcgg ?? 0;
  sfasIndividual.lfp = options?.initialValues?.lfp ?? 0;
  sfasIndividual.pal = options?.initialValues?.pal ?? 0;
  sfasIndividual.cmsOveraward = options?.initialValues?.cmsOveraward ?? 0;
  sfasIndividual.cslOveraward = options?.initialValues?.cslOveraward ?? 0;
  sfasIndividual.bcslOveraward = options?.initialValues?.bcslOveraward ?? 0;
  sfasIndividual.grantOveraward = options?.initialValues?.grantOveraward ?? 0;
  sfasIndividual.withdrawals = options?.initialValues?.withdrawals ?? 0;
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
