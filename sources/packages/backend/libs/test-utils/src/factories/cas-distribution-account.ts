import { CASDistributionAccount, OfferingIntensity, User } from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates a fake CAS distribution account ready to be saved to the database.
 * @param relations dependencies.
 * - `creator` the user that created the CAS distribution account.
 * @param options options.
 * - `initialValues` CAS distribution account values.
 * @returns a fake CAS distribution account.
 */
export function createFakeCASDistributionAccount(
  relations: { creator: User },
  options?: {
    initialValues: Partial<CASDistributionAccount>;
  },
): CASDistributionAccount {
  const casDistributionAccount = new CASDistributionAccount();
  casDistributionAccount.awardValueCode =
    options?.initialValues?.awardValueCode ?? "BCSG";
  casDistributionAccount.offeringIntensity =
    options?.initialValues?.offeringIntensity ?? OfferingIntensity.fullTime;
  casDistributionAccount.operationCode =
    options?.initialValues?.operationCode ?? "DR";
  casDistributionAccount.distributionAccount =
    options?.initialValues?.distributionAccount ??
    faker.random.alphaNumeric(40);
  casDistributionAccount.isActive = options?.initialValues?.isActive ?? true;
  casDistributionAccount.creator = relations.creator;
  return casDistributionAccount;
}
