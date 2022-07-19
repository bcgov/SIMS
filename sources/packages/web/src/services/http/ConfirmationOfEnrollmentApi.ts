import {
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
  EnrollmentPeriod,
  PaginationOptions,
  COESummaryAPIOutDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { getPaginationQueryString } from "@/helpers";
import { ConfirmationOfEnrollmentAPIInDTO } from "@/services/http/dto/ConfirmationOfEnrolment.dto";
import { PaginatedResultsAPIOutDTO } from "./dto";

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
    let url = `institution/location/${locationId}/confirmation-of-enrollment/enrollmentPeriod/${enrollmentPeriod}?`;
    url = getPaginationQueryString(paginationOptions);
    return this.getCallTyped<PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }

  async getApplicationForCOE(
    disbursementScheduleId: number,
    locationId: number,
  ): Promise<ApplicationDetailsForCOEDTO> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async confirmCOE(
    locationId: number,
    disbursementScheduleId: number,
    confirmationData: ConfirmationOfEnrollmentAPIInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        `institution/location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}/confirm`,
        confirmationData,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  async rollbackCOE(locationId: number, applicationId: number): Promise<void> {
    try {
      await this.apiClient.post(
        `institution/location/${locationId}/confirmation-of-enrollment/application/${applicationId}/rollback`,
        null,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async getCOEDenialReasons(): Promise<COEDeniedReasonDto> {
    try {
      const response = await this.apiClient.get(
        "institution/location/confirmation-of-enrollment/denial-reasons",
        this.addAuthHeader(),
      );
      return response?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async denyConfirmationOfEnrollment(
    locationId: number,
    disbursementScheduleId: number,
    denyCOEPayload: DenyConfirmationOfEnrollment,
  ): Promise<void> {
    await this.patchCall<DenyConfirmationOfEnrollment>(
      `institution/location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}/deny`,
      denyCOEPayload,
    );
  }
}
