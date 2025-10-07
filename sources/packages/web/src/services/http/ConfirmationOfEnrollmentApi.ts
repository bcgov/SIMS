import { EnrollmentPeriod, PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { getPaginationQueryString } from "@/helpers";
import {
  ApplicationDetailsForCOEAPIOutDTO,
  COEDeniedReasonAPIOutDTO,
  COESummaryAPIOutDTO,
  ConfirmationOfEnrollmentAPIInDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export class ConfirmationOfEnrollmentApi extends HttpBaseClient {
  /**
   * Get all Confirmation Of Enrollment(COE) of a location in an institution.
   * Paginated with COE status as default sort.
   * @param locationId location to retrieve confirmation of enrollments.
   * @param enrollmentPeriod types of the period (e.g. current, upcoming)
   * @param paginationOptions options for pagination.
   * @returns COE paginated result.
   */
  async getCOESummary(
    locationId: number,
    enrollmentPeriod: EnrollmentPeriod,
    paginationOptions: PaginationOptions,
    enableZeroPage = true,
  ): Promise<PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>> {
    let url = `location/${locationId}/confirmation-of-enrollment/enrollmentPeriod/${enrollmentPeriod}?`;
    url += getPaginationQueryString(paginationOptions, enableZeroPage);
    return this.getCall<PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }

  /**
   * Get the application details for the Confirmation Of Enrollment(COE).
   * @param locationId location id.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @returns application details for COE.
   */
  async getApplicationForCOE(
    disbursementScheduleId: number,
    locationId: number,
  ): Promise<ApplicationDetailsForCOEAPIOutDTO> {
    return this.getCall<ApplicationDetailsForCOEAPIOutDTO>(
      this.addClientRoot(
        `location/${locationId}/confirmation-of-enrollment/disbursement-schedule/${disbursementScheduleId}`,
      ),
    );
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id of the application.
   * @param payload COE confirmation information.
   */
  async confirmEnrollment(
    disbursementScheduleId: number,
    locationId?: number,
    payload?: ConfirmationOfEnrollmentAPIInDTO,
  ): Promise<void> {
    const baseUrl = locationId ? `location/${locationId}/` : "";
    await this.patchCall(
      this.addClientRoot(
        `${baseUrl}confirmation-of-enrollment/disbursement-schedule/${disbursementScheduleId}/confirm`,
      ),
      payload,
    );
  }

  /**
   * Get all COE denied reasons, which are active.
   * @returns COE denied reason list.
   */
  async getCOEDenialReasons(): Promise<COEDeniedReasonAPIOutDTO> {
    return this.getCall<COEDeniedReasonAPIOutDTO>(
      this.addClientRoot("location/confirmation-of-enrollment/denial-reasons"),
    );
  }

  /**
   * Deny the Confirmation Of Enrollment(COE).
   ** Note: If an application has 2 COEs, and if the first COE is Rejected then 2nd COE is implicitly rejected.
   * @param locationId location that is completing the COE.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param payload contains the denied reason of the
   * student application.
   */
  async denyConfirmationOfEnrollment(
    locationId: number,
    disbursementScheduleId: number,
    payload: DenyConfirmationOfEnrollmentAPIInDTO,
  ): Promise<void> {
    await this.patchCall<DenyConfirmationOfEnrollmentAPIInDTO>(
      this.addClientRoot(
        `location/${locationId}/confirmation-of-enrollment/disbursement-schedule/${disbursementScheduleId}/deny`,
      ),
      payload,
    );
  }
}
