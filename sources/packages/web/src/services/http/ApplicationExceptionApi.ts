import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  ApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";

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
   * @returns student application exception information.
   */
  async getExceptionById(
    exceptionId: number,
  ): Promise<ApplicationExceptionAPIOutDTO> {
    return this.getCallTyped<ApplicationExceptionAPIOutDTO>(
      this.addClientRoot(`application-exception/${exceptionId}`),
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
}
