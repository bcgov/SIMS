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
  ): Promise<PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>> {
    let url = `location/${locationId}/confirmation-of-enrollment/enrollmentPeriod/${enrollmentPeriod}?`;
    url += getPaginationQueryString(paginationOptions);
    return this.getCallTyped<PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>>(
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
    return this.getCallTyped<ApplicationDetailsForCOEAPIOutDTO>(
      this.addClientRoot(
        `location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}`,
      ),
    );
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param locationId location id of the application.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param payload COE confirmation information.
   */
  async confirmEnrollment(
    locationId: number,
    disbursementScheduleId: number,
    payload: ConfirmationOfEnrollmentAPIInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        `location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}/confirm`,
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  /**
   * Creates a new Student Application to maintain history,
   * overriding the current one in order to rollback the
   * process and start the assessment all over again.
   * @param locationId location id executing the COE rollback.
   * @param applicationId application to be rolled back.
   * @returns the id of the newly created Student Application.
   */
  async rollbackCOE(locationId: number, applicationId: number): Promise<void> {
    await this.postCall(
      `location/${locationId}/confirmation-of-enrollment/application/${applicationId}/rollback`,
      null,
    );
  }

  /**
   * Get all COE denied reasons, which are active.
   * @returns COE denied reason list.
   */
  async getCOEDenialReasons(): Promise<COEDeniedReasonAPIOutDTO> {
    return await this.getCallTyped<COEDeniedReasonAPIOutDTO>(
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
      `location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}/deny`,
      payload,
    );
  }
}
