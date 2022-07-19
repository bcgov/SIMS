import {
  PaginatedResults,
  COESummaryAPIOutDTO,
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
  EnrollmentPeriod,
  PaginationOptions,
} from "@/types";
import ApiClient from "./http/ApiClient";
import { ConfirmationOfEnrollmentAPIInDTO } from "@/services/http/dto/ConfirmationOfEnrolment.dto";
import { PaginatedResultsAPIOutDTO } from "./http/dto";

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

  async getApplicationForCOE(
    disbursementScheduleId: number,
    locationId: number,
  ): Promise<ApplicationDetailsForCOEDTO> {
    return ApiClient.ConfirmationOfEnrollment.getApplicationForCOE(
      disbursementScheduleId,
      locationId,
    );
  }

  async confirmCOE(
    locationId: number,
    disbursementScheduleId: number,
    confirmationData: ConfirmationOfEnrollmentAPIInDTO,
  ): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.confirmCOE(
      locationId,
      disbursementScheduleId,
      confirmationData,
    );
  }

  async rollbackCOE(locationId: number, applicationId: number): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.rollbackCOE(
      locationId,
      applicationId,
    );
  }

  async getCOEDenialReasons(): Promise<COEDeniedReasonDto> {
    return ApiClient.ConfirmationOfEnrollment.getCOEDenialReasons();
  }

  async denyConfirmationOfEnrollment(
    locationId: number,
    disbursementScheduleId: number,
    denyCOEPayload: DenyConfirmationOfEnrollment,
  ): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.denyConfirmationOfEnrollment(
      locationId,
      disbursementScheduleId,
      denyCOEPayload,
    );
  }
}
