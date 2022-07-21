import { EnrollmentPeriod, PaginationOptions } from "@/types";
import ApiClient from "./http/ApiClient";
import {
  ApplicationDetailsForCOEAPIOutDTO,
  COEDeniedReasonAPIOutDTO,
  COESummaryAPIOutDTO,
  ConfirmationOfEnrollmentAPIInDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export class ConfirmationOfEnrollmentService {
  // Share Instance
  private static instance: ConfirmationOfEnrollmentService;

  static get shared(): ConfirmationOfEnrollmentService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get all Confirmation Of Enrollment(COE) of a location in an institution
   * This API is paginated with COE Status as default sort.
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
    return ApiClient.ConfirmationOfEnrollment.getCOESummary(
      locationId,
      enrollmentPeriod,
      paginationOptions,
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
    return ApiClient.ConfirmationOfEnrollment.getApplicationForCOE(
      disbursementScheduleId,
      locationId,
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
    await ApiClient.ConfirmationOfEnrollment.confirmEnrollment(
      locationId,
      disbursementScheduleId,
      payload,
    );
  }

  /**
   * Get all COE denied reasons, which are active.
   * @returns COE denied reason list.
   */
  async getCOEDenialReasons(): Promise<COEDeniedReasonAPIOutDTO> {
    return ApiClient.ConfirmationOfEnrollment.getCOEDenialReasons();
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
    await ApiClient.ConfirmationOfEnrollment.denyConfirmationOfEnrollment(
      locationId,
      disbursementScheduleId,
      payload,
    );
  }
}
