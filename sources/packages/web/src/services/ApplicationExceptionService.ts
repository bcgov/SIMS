import ApiClient from "@/services/http/ApiClient";
import {
  ApplicationExceptionAPIOutDTO,
  ApplicationExceptionSummaryAPIOutDTO,
  DetailedApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";
import { PaginatedResults, PaginationOptions } from "@/types";

export class ApplicationExceptionService {
  // Share Instance
  private static instance: ApplicationExceptionService;

  public static get shared(): ApplicationExceptionService {
    return this.instance || (this.instance = new this());
  }

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
      | DetailedApplicationExceptionAPIOutDTO
      | ApplicationExceptionAPIOutDTO,
  >(
    exceptionId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<T> {
    return ApiClient.ApplicationExceptionApi.getExceptionDetails<T>(
      exceptionId,
      studentId,
      applicationId,
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
    await ApiClient.ApplicationExceptionApi.approveException(
      exceptionId,
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
  ): Promise<PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>> {
    return ApiClient.ApplicationExceptionApi.getPendingExceptions(
      paginationOptions,
    );
  }
}
