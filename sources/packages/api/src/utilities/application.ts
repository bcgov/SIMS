import { Application } from "../database/entities";
import {
  COE_DENIED_REASON_OTHER_ID,
  PIR_DENIED_REASON_OTHER_ID,
} from "../utilities";

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
