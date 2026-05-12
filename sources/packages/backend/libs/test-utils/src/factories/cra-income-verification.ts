import {
  Application,
  CRAIncomeVerification,
  SupportingUser,
  User,
} from "@sims/sims-db";
import { createFakeApplication } from "@sims/test-utils/factories/application";

/**
 * Creates a CRA income verification ready to be saved to the database.
 * @param relations dependencies.
 * - `application` related student application.
 * - `supportingUser` related supporting user.
 * - `applicationEditStatusUpdatedBy` user updating the edit status.
 * @param options student options.
 * - `initialValues` CRA income verification values.
 * @returns a CRA income verification ready to be saved to the database.
 */
export function createFakeCRAIncomeVerification(
  relations?: {
    application?: Application;
    supportingUser?: SupportingUser;
    applicationEditStatusUpdatedBy?: User;
  },
  options?: {
    initialValues?: Partial<CRAIncomeVerification>;
  },
): CRAIncomeVerification {
  const craIncomeVerification = new CRAIncomeVerification();
  const application =
    relations?.application ?? createFakeApplication(relations);
  craIncomeVerification.taxYear = options?.initialValues?.taxYear ?? 2022;
  craIncomeVerification.craReportedIncome =
    options?.initialValues?.craReportedIncome ?? undefined;
  craIncomeVerification.reportedIncome =
    options?.initialValues?.reportedIncome ?? 5000;
  craIncomeVerification.application = application;
  craIncomeVerification.supportingUser = relations?.supportingUser ?? undefined;
  craIncomeVerification.dateReceived =
    options?.initialValues?.dateReceived ?? undefined;
  craIncomeVerification.fileReceived =
    options?.initialValues?.fileReceived ?? undefined;
  craIncomeVerification.dateSent =
    options?.initialValues?.dateSent ?? undefined;
  craIncomeVerification.fileSent =
    options?.initialValues?.fileSent ?? undefined;
  return craIncomeVerification;
}
