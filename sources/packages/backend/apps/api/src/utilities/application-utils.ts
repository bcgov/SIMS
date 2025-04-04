import { Application, DisbursementSchedule } from "@sims/sims-db";
import { PIR_DENIED_REASON_OTHER_ID } from ".";
import { COE_DENIED_REASON_OTHER_ID } from "@sims/utilities";
export const STUDY_DATE_OVERLAP_ERROR = "STUDY_DATE_OVERLAP_ERROR";
export const STUDY_DATE_OVERLAP_ERROR_MESSAGE =
  "There is an existing application already with overlapping study dates or a pending program information request. Please contact your institution for further assistance.";
/**
 * Gets PIR denied reason
 * @param application application Object.
 * @returns PIR denied reason.
 */
export function getPIRDeniedReason(application: Application): string {
  return application.pirDeniedReasonId?.id === PIR_DENIED_REASON_OTHER_ID
    ? application.pirDeniedOtherDesc
    : application.pirDeniedReasonId?.reason;
}

/**
 * Gets COE denied reason
 * @param disbursementSchedule application Object.
 * @returns COE denied reason.
 */
export function getCOEDeniedReason(
  disbursementSchedule: DisbursementSchedule,
): string {
  return disbursementSchedule.coeDeniedReason?.id === COE_DENIED_REASON_OTHER_ID
    ? disbursementSchedule.coeDeniedOtherDesc
    : disbursementSchedule.coeDeniedReason?.reason;
}
