import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  ApplicationExceptionAPIOutDTO,
  ApplicationExceptionSummaryAPIOutDTO,
  DetailedApplicationExceptionAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";
import { PaginatedResults, PaginationOptions } from "@/types";

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
   * @param applicationId application id.
   * @returns student application exception information.
   */
  async getExceptionDetails<
    T extends
      | ApplicationExceptionAPIOutDTO
      | DetailedApplicationExceptionAPIOutDTO,
  >(
    exceptionId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<T> {
    const endpoint = studentId
      ? `application-exception/student/${studentId}/application/${applicationId}/exception/${exceptionId}`
      : `application-exception/${exceptionId}`;
    return this.getCall<T>(this.addClientRoot(endpoint));
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
    let url = `application-exception?`;
    url += getPaginationQueryString(paginationOptions);
    return this.getCall<PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }
}
