import ApiClient from "@/services/http/ApiClient";
import {
  ApplicationExceptionAPIOutDTO,
  ApplicationExceptionSummaryAPIOutDTO,
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
   * @returns student application exception information.
   */
  async getExceptionById(
    exceptionId: number,
  ): Promise<ApplicationExceptionAPIOutDTO> {
    return ApiClient.ApplicationExceptionApi.getExceptionById(exceptionId);
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
   * Gets all student application exceptions.
   * @param paginationOptions options to execute the pagination.
   * @returns list of student application exceptions.
   */
  async getExceptions(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>> {
    return ApiClient.ApplicationExceptionApi.getExceptions(paginationOptions);
  }
}
