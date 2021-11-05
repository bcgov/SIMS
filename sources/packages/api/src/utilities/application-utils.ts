import { Application } from "../database/entities";
import { GetApplicationDataDto } from "../route-controllers/application/models/application.model";
import { dateString } from "../utilities";
import { COE_DENIED_REASON_OTHER_ID, PIR_DENIED_REASON_OTHER_ID } from ".";

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

export const transformToApplicationDto = (
  application: Application,
): GetApplicationDataDto => {
  return {
    data: application.data,
    id: application.id,
    applicationStatus: application.applicationStatus,
    applicationStatusUpdatedOn: application.applicationStatusUpdatedOn,
    applicationNumber: application.applicationNumber,
    applicationOfferingIntensity: application.offering?.offeringIntensity,
    applicationStartDate: dateString(application.offering?.studyStartDate),
    applicationEndDate: dateString(application.offering?.studyEndDate),
    applicationInstitutionName: application.location?.name,
    applicationPIRStatus: application.pirStatus,
    applicationAssessmentStatus: application.assessmentStatus,
    applicationCOEStatus: application.coeStatus,
    applicationFormName: application.programYear.formName,
    applicationProgramYearID: application.programYear.id,
    applicationPIRDeniedReason: getPIRDeniedReason(application),
    applicationCOEDeniedReason: getCOEDeniedReason(application),
  };
};
