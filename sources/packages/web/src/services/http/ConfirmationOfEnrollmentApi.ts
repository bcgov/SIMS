import {
  COESummaryAndCount,
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
  EnrollmentPeriod,
  PaginationOptions,
  FieldSortOrder,
  DataTableSortOrder,
  PaginationParams,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ConfirmationOfEnrollmentApi extends HttpBaseClient {
  public async getCOESummary(
    locationId: number,
    enrollmentPeriod: EnrollmentPeriod,
    paginationOptions: PaginationOptions,
  ): Promise<COESummaryAndCount> {
    const apiSortOrder =
      paginationOptions.sortOrder === DataTableSortOrder.DESC
        ? FieldSortOrder.DESC
        : FieldSortOrder.ASC;
    let URL = `institution/location/${locationId}/confirmation-of-enrollment/enrollmentPeriod/${enrollmentPeriod}`;
    /**Adding Sort params. There is always a default sortField and sortOrder. */
    URL = `${URL}?${PaginationParams.SortField}=${paginationOptions.sortField}&${PaginationParams.SortOrder}=${apiSortOrder}`;

    /** Adding pagination params. There is always a default page and pageLimit. */
    URL = `${URL}&${PaginationParams.Page}=${paginationOptions.page}&${PaginationParams.PageLimit}=${paginationOptions.pageLimit}`;

    /** Search criteria is populated only when search box has search text in it. */
    if (paginationOptions.searchCriteria) {
      URL = `${URL}&${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`;
    }
    return await this.getCallTyped<COESummaryAndCount>(URL);
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
  ): Promise<void> {
    await this.patchCall(
      `institution/location/${locationId}/confirmation-of-enrollment/disbursement/${disbursementScheduleId}/confirm`,
      {},
    );
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
