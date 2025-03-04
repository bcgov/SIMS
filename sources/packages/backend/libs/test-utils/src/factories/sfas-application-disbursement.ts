import { SFASApplication, SFASApplicationDisbursement } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create fake SFAS application disbursement.
 * @param relations entity relations.
 * @param options SFAS application disbursement options.
 * - `initialValues` SFAS application disbursement initial values.
 * @returns sfas application disbursement.
 */
export function createFakeSFASApplicationDisbursement(
  relations: { sfasApplication: SFASApplication },
  options?: {
    initialValues?: Partial<SFASApplicationDisbursement>;
  },
): SFASApplicationDisbursement {
  const sfasApplicationDependant = new SFASApplicationDisbursement();
  sfasApplicationDependant.id = faker.datatype.number({
    min: 100000000,
    max: 999999999,
  });
  sfasApplicationDependant.application = relations.sfasApplication;
  sfasApplicationDependant.fundingType =
    options?.initialValues?.fundingType ?? "BSL";
  sfasApplicationDependant.fundingAmount =
    options?.initialValues?.fundingAmount ?? 100;
  sfasApplicationDependant.fundingDate =
    options?.initialValues?.fundingDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasApplicationDependant.dateIssued =
    options?.initialValues?.dateIssued ??
    getISODateOnlyString(faker.date.past(18));
  sfasApplicationDependant.extractedAt = new Date();
  return sfasApplicationDependant;
}
