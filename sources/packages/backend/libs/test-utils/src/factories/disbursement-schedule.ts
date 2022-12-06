import {
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";

export function createFakeDisbursementSchedule(relations?: {
  studentAssessment?: StudentAssessment;
  auditUser?: User;
  disbursementValues?: DisbursementValue[];
}): DisbursementSchedule {
  const now = new Date();
  const nowString = getISODateOnlyString(now);
  const schedule = new DisbursementSchedule();
  schedule.documentNumber = null;
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
