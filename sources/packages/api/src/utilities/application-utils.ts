import {
  Application,
  SFASApplication,
  SFASPartTimeApplications,
} from "../database/entities";
import { COE_DENIED_REASON_OTHER_ID, PIR_DENIED_REASON_OTHER_ID } from ".";
import { ApplicationSummaryDTO } from "../route-controllers/application/models/application.model";
import { UnprocessableEntityException } from "@nestjs/common";
export const PIR_OR_DATE_OVERLAP_ERROR = "PIR_OR_DATE_OVERLAP_ERROR";
export const PIR_OR_DATE_OVERLAP_ERROR_MESSAGE =
  "There is an existing application already with overlapping study period or a pending PIR.";
/**
 * Gets PIR denied reason
 * @param applicationDetails application Object.
 * @returns PIR denied reason.
 */
export function getPIRDeniedReason(application: Application): string {
  return application.pirDeniedReasonId?.id === PIR_DENIED_REASON_OTHER_ID
    ? application.pirDeniedOtherDesc
    : application.pirDeniedReasonId?.reason;
}

/**
 * Gets COE denied reason
 * @param applicationDetails application Object.
 * @returns COE denied reason.
 */
export function getCOEDeniedReason(application: Application): string {
  return application.coeDeniedReason?.id === COE_DENIED_REASON_OTHER_ID
    ? application.coeDeniedOtherDesc
    : application.coeDeniedReason?.reason;
}

/**
 * Util to transform application entity model to ApplicationSummaryDTO.
 * @param Entity
 * @returns StudentApplicationAndCount
 */
export const transformToApplicationSummaryDTO = (
  application: Application,
): ApplicationSummaryDTO => {
  return {
    applicationNumber: application.applicationNumber,
    id: application.id,
    studyStartPeriod: application.offering?.studyStartDate
      ? application.offering?.studyStartDate
      : "",
    studyEndPeriod: application.offering?.studyEndDate
      ? application.offering?.studyEndDate
      : "",
    // TODO: when application name is captured, update the below line
    applicationName: "Financial Aid Application",
    // TODO: when each status date are captured updated below line
    submitted: "",
    status: application.applicationStatus,
  } as ApplicationSummaryDTO;
};
