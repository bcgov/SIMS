import { addPaginationOptions, addSortOptions } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  ApplicationExceptionAPIOutDTO,
  ApplicationExceptionSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";
import { PaginatedResults, PaginationOptions, PaginationParams } from "@/types";

/**
 * Http API client for the student application exceptions, for instance, when a
 * Student Application is submitted and there are some files that must be
 * reviewed.
 */
export class ApplicationExceptionApi extends HttpBaseClient {
  /**
   * Get a student application exception detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @param studentId student id.
   * @returns student application exception information.
   */
  async getExceptionDetails(
    exceptionId: number,
    studentId?: number,
  ): Promise<ApplicationExceptionAPIOutDTO> {
    const endpoint = studentId
      ? `application-exception/student/${studentId}/exception/${exceptionId}`
      : `application-exception/${exceptionId}`;
    return this.getCall<ApplicationExceptionAPIOutDTO>(
      this.addClientRoot(endpoint),
    );
  }

  /**
   * Updates the student application exception approving or denying it.
   * @param exceptionId exception to be approved or denied.
   * @param payload information to approve or deny the exception.
   */
  async approveException(
    exceptionId: number,
    payload: UpdateApplicationExceptionAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`application-exception/${exceptionId}`),
      payload,
    );
  }

  /**
   * Gets all pending student application exceptions.
   * @param paginationOptions options to execute the pagination.
   * @returns list of student application exceptions.
   */
  async getPendingExceptions(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationExceptionSummaryAPIOutDTO>> {
    let url = `application-exception`;
    // Adding pagination params. There is always a default page and pageLimit for paginated APIs.
    url = addPaginationOptions(
      url,
      paginationOptions.page,
      paginationOptions.pageLimit,
      "?",
    );

    //Adding Sort params. There is always a default sortField and sortOrder for Active Applications.
    url = addSortOptions(
      url,
      paginationOptions.sortField,
      paginationOptions.sortOrder,
    );

    // Search criteria is populated only when search box has search text in it.
    if (paginationOptions.searchCriteria) {
      url = `${url}&${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`;
    }
    return this.getCall<PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }
}
