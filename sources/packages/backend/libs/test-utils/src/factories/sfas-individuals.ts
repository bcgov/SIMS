import { SFASIndividual } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { faker } from "@faker-js/faker";
import { createFakeStudent } from "@sims/test-utils/factories/student";

/**
 * Create fake sfas individual.
 * @param options sfas individual options.
 * - `initialValues` sfas individual initial values.
 * - `includeAddressLine2` include address line 2.
 * @returns created sfas individual.
 */
export function createFakeSFASIndividual(options?: {
  initialValues?: Partial<SFASIndividual>;
  includeAddressLine2?: boolean;
}) {
  const fakeMSFAANumber = faker.number
    .int({
      min: 1000000000,
      max: 9999999999,
    })
    .toString();
  const fakeId = faker.number.int({ min: 100000000, max: 999999999 });
  const fakeSIN = faker.number
    .int({ min: 100000000, max: 899999999 })
    .toString();

  const sfasIndividual = new SFASIndividual();
  sfasIndividual.id = options?.initialValues?.id ?? fakeId;
  sfasIndividual.birthDate =
    options?.initialValues?.birthDate ??
    getISODateOnlyString(faker.date.past({ years: 18 }));
  sfasIndividual.msfaaNumber =
    options?.initialValues?.msfaaNumber ?? fakeMSFAANumber;
  sfasIndividual.partTimeMSFAANumber =
    options?.initialValues?.partTimeMSFAANumber ?? fakeMSFAANumber;
  sfasIndividual.firstName =
    options?.initialValues?.firstName ?? faker.person.firstName();
  sfasIndividual.lastName =
    options?.initialValues?.lastName ?? faker.person.lastName();
  sfasIndividual.sin = options?.initialValues?.sin ?? fakeSIN;
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
  sfasIndividual.student =
    options?.initialValues?.student ?? createFakeStudent();
  sfasIndividual.phoneNumber =
    options?.initialValues?.phoneNumber ?? +faker.number.int(9999999999);
  sfasIndividual.addressLine1 =
    options?.initialValues?.addressLine1 ?? faker.location.streetAddress();
  sfasIndividual.city = options?.initialValues?.city ?? faker.location.city();
  sfasIndividual.provinceState = options?.initialValues?.provinceState ?? "BC";
  sfasIndividual.country = options?.initialValues?.country ?? "CAN";
  sfasIndividual.postalZipCode =
    options?.initialValues?.postalZipCode ?? "A1A 1A1";
  if (options?.includeAddressLine2) {
    sfasIndividual.addressLine2 =
      options?.initialValues?.addressLine2 ?? faker.location.secondaryAddress();
  }
  sfasIndividual.updatedAt = options?.initialValues?.updatedAt;
  return sfasIndividual;
}

/**
 * Create and save fake sfas individual.
 * @param dataSource data source to persist the sfas individual.
 * @param options sfas individual options.
 * - `initialValues` sfas individual initial values.
 * - `includeAddressLine2` include address line 2.
 * @returns persisted sfas individual.
 */
export async function saveFakeSFASIndividual(
  dataSource: DataSource,
  options?: {
    initialValues?: Partial<SFASIndividual>;
    includeAddressLine2?: boolean;
  },
): Promise<SFASIndividual> {
  const sfasIndividualRepo = dataSource.getRepository(SFASIndividual);
  const sfasIndividual = await sfasIndividualRepo.save(
    createFakeSFASIndividual(options),
  );
  return sfasIndividualRepo.save(sfasIndividual);
}
