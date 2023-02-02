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

export function createFakeDisbursementSchedule(relations?: {
  studentAssessment?: StudentAssessment;
  auditUser?: User;
  disbursementValues?: DisbursementValue[];
}): DisbursementSchedule {
  const now = new Date();
  const nowString = getISODateOnlyString(now);
  const schedule = new DisbursementSchedule();
  schedule.documentNumber = faker.random.number(2147483647);
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
