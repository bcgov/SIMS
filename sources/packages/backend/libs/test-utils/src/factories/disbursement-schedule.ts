import {
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Disbursement awards.
 */
interface DisbursementAwards {
  [disbursementValueCode: string]: number;
}

export function createFakeDisbursementSchedule(relations?: {
  studentAssessment?: StudentAssessment;
  auditUser?: User;
  disbursementValues?: DisbursementValue[];
}): DisbursementSchedule {
  const now = new Date();
  const nowString = getISODateOnlyString(now);
  const schedule = new DisbursementSchedule();
  // Fake number generated based on the max value that a document number can have as
  // per e-Cert documentation. Numbers under 1000000 can still be used for E2E tests.
  schedule.documentNumber = faker.random.number({ min: 1000000, max: 9999999 });
  schedule.disbursementDate = nowString;
  schedule.negotiatedExpiryDate = nowString;
  schedule.dateSent = null;
  schedule.disbursementValues = relations?.disbursementValues;
  schedule.coeStatus = COEStatus.required;
  schedule.coeUpdatedBy = null;
  schedule.coeUpdatedAt = null;
  schedule.coeDeniedReason = null;
  schedule.coeDeniedOtherDesc = null;
  schedule.studentAssessment = relations?.studentAssessment;
  schedule.tuitionRemittanceRequestedAmount = 0;
  schedule.disbursementScheduleStatus = DisbursementScheduleStatus.Pending;
  return schedule;
}

/**
 * Creates disbursement schedule awards based on the given schedule and disbursement number.
 * @param disbursementSchedule Disbursement schedule containing disbursement values.
 * @param disbursementNumber Number associated with the disbursement schedule (e.g., 1 for the first, 2 for the second).
 * @returns Disbursement awards with keys like 'disbursement1code' and values as amounts.
 */
export function createDisbursementScheduleAwards(
  disbursementSchedule: DisbursementSchedule,
  disbursementNumber: number,
): DisbursementAwards {
  const disbursementScheduleAwards: DisbursementAwards = {};

  disbursementSchedule.disbursementValues.forEach((disbursementValue) => {
    disbursementScheduleAwards[
      `disbursement${disbursementNumber}${disbursementValue.valueCode.toLowerCase()}`
    ] = disbursementValue.valueAmount;
  });

  return disbursementScheduleAwards;
}
