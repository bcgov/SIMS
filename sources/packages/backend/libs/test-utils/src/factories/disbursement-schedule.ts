import {
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  StudentAssessment,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Creates a disbursement schedule.
 * @param relations dependencies.
 * - `studentAssessment` student assessment.
 * - `disbursementValues` disbursement values to be inserted.
 * @param options additional options.
 * - `initialValues` initial values.
 * @returns
 */
export function createFakeDisbursementSchedule(
  relations?: {
    studentAssessment?: StudentAssessment;
    disbursementValues?: DisbursementValue[];
  },
  options?: {
    initialValues?: Partial<DisbursementSchedule>;
  },
): DisbursementSchedule {
  const now = new Date();
  const nowString = getISODateOnlyString(now);
  const schedule = new DisbursementSchedule();
  // Fake number generated based on the max value that a document number can have as
  // per e-Cert documentation. Numbers under 1000000 can still be used for E2E tests.
  schedule.documentNumber =
    options?.initialValues?.documentNumber ??
    faker.datatype.number({ min: 1000000, max: 9999999 });
  schedule.disbursementDate =
    options?.initialValues?.disbursementDate ?? nowString;
  schedule.negotiatedExpiryDate = nowString;
  schedule.dateSent = options?.initialValues?.dateSent;
  schedule.disbursementValues = relations?.disbursementValues;
  schedule.coeStatus = options?.initialValues?.coeStatus ?? COEStatus.required;
  schedule.coeUpdatedBy = null;
  schedule.coeUpdatedAt = options?.initialValues?.coeUpdatedAt;
  schedule.coeDeniedReason = null;
  schedule.coeDeniedOtherDesc = null;
  schedule.studentAssessment = relations?.studentAssessment;
  schedule.tuitionRemittanceRequestedAmount =
    options?.initialValues?.tuitionRemittanceRequestedAmount ?? 0;
  schedule.disbursementScheduleStatus =
    options?.initialValues?.disbursementScheduleStatus ??
    DisbursementScheduleStatus.Pending;
  return schedule;
}
