import { Application, DisbursementSchedule } from "../database/entities";
import { COE_DENIED_REASON_OTHER_ID, PIR_DENIED_REASON_OTHER_ID } from ".";
import { ApplicationSummaryDTO } from "../route-controllers/application/models/application.model";
import { getISODateOnlyString } from "./date-utils";
export const PIR_OR_DATE_OVERLAP_ERROR = "PIR_OR_DATE_OVERLAP_ERROR";
export const PIR_OR_DATE_OVERLAP_ERROR_MESSAGE =
  "There is an existing application already with overlapping study period or a pending PIR.";
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

/**
 * Util to transform application entity model to ApplicationSummaryDTO.
 * @param application application to be converted to a DTO.
 * @returns application DTO in a summary format.
 */
export const transformToApplicationSummaryDTO = (
  application: Application,
): ApplicationSummaryDTO => {
  const offering = application.currentAssessment?.offering;
  return {
    id: application.id,
    applicationNumber: application.applicationNumber,
    studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
    studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
    // TODO: when application name is captured, update the below line
    applicationName: "Financial Aid Application",
    submitted: application.currentAssessment?.submittedDate,
    status: application.applicationStatus,
  } as ApplicationSummaryDTO;
};
