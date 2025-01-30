import { CASDistributionAccount, OfferingIntensity, User } from "@sims/sims-db";

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
  const awardValueCode = options?.initialValues?.awardValueCode ?? "BCAG";
  const offeringIntensity =
    options?.initialValues?.offeringIntensity ?? OfferingIntensity.fullTime;
  const operationCode = options?.initialValues?.operationCode ?? "DR";
  const distributionAccount =
    options?.initialValues?.distributionAccount ??
    `${awardValueCode}.${operationCode}.${
      offeringIntensity === OfferingIntensity.fullTime
        ? "FULL-TIME"
        : "PART-TIME"
    }.`.padEnd(40, "0");
  const casDistributionAccount = new CASDistributionAccount();
  casDistributionAccount.awardValueCode = awardValueCode;
  casDistributionAccount.offeringIntensity = offeringIntensity;
  casDistributionAccount.operationCode = operationCode;
  casDistributionAccount.distributionAccount = distributionAccount;
  casDistributionAccount.isActive = options?.initialValues?.isActive ?? true;
  casDistributionAccount.creator = relations.creator;
  return casDistributionAccount;
}
