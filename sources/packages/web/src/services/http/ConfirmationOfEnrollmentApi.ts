import {
  PaginatedResults,
  COESummaryDTO,
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
  EnrollmentPeriod,
  PaginationOptions,
  PaginationParams,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { addSortOptions, addPaginationOptions } from "@/helpers";
import { ConfirmationOfEnrollmentAPIInDTO } from "./dto/ConfirmationOfEnrolment.dto";

export class ConfirmationOfEnrollmentApi extends HttpBaseClient {
  public async getCOESummary(
    locationId: number,
    enrollmentPeriod: EnrollmentPeriod,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<COESummaryDTO>> {
    let url = `institution/location/${locationId}/confirmation-of-enrollment/enrollmentPeriod/${enrollmentPeriod}`;

    // Adding pagination params. There is always a default page and pageLimit for paginated APIs.
    url = addPaginationOptions(
      url,
      paginationOptions.page,
      paginationOptions.pageLimit,
      "?",
    );

    //Adding Sort params. There is always a default sortField and sortOrder for COE.
    url = addSortOptions(
      url,
      paginationOptions.sortField,
      paginationOptions.sortOrder,
    );

    // Search criteria is populated only when search box has search text in it.
    if (paginationOptions.searchCriteria) {
      url = `${url}&${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`;
    }
    return this.getCallTyped<PaginatedResults<COESummaryDTO>>(url);
  }

  public async getApplicationForCOE(
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

  public async confirmCOE(
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

  public async rollbackCOE(
    locationId: number,
    applicationId: number,
  ): Promise<void> {
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

  public async getCOEDenialReasons(): Promise<COEDeniedReasonDto> {
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

  public async denyConfirmationOfEnrollment(
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
