import {
  Application,
  CRAIncomeVerification,
  SupportingUser,
} from "@sims/sims-db";
import { createFakeApplication } from "@sims/test-utils/factories/application";

/**
 * Creates a CRA income verification ready to be saved to the database.
 * @param relations dependencies.
 * - `application` related student application.
 * - `supportingUser` related supporting user.
 * @param options student options.
 * - `initialValues` CRA income verification values.
 * @returns a CRA income verification ready to be saved to the database.
 */
export function createFakeCRAIncomeVerification(
  relations?: {
    application?: Application;
    supportingUser?: SupportingUser;
  },
  options?: {
    initialValues?: Partial<CRAIncomeVerification>;
  },
): CRAIncomeVerification {
  const craIncomeVerification = new CRAIncomeVerification();
  const application = relations?.application ?? createFakeApplication();
  craIncomeVerification.taxYear = options?.initialValues?.taxYear ?? 2022;
  craIncomeVerification.reportedIncome =
    options?.initialValues?.reportedIncome ?? 5000;
  craIncomeVerification.application = application;
  craIncomeVerification.supportingUser = relations?.supportingUser ?? null;
  craIncomeVerification.dateReceived =
    options?.initialValues?.dateReceived ?? null;
  return craIncomeVerification;
}
