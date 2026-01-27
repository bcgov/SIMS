import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionsAPIOutDTO,
} from "@/services/http/dto/FormSubmission.dto";

/**
 * Http API client for Form Submissions.
 */
export class FormSubmissionsApi extends HttpBaseClient {
  async getFormSubmissionSummary(): Promise<FormSubmissionsAPIOutDTO> {
    return this.getCall(this.addClientRoot("form-submission"));
  }

  async submitApplicationAppeal(
    payload: FormSubmissionAPIInDTO,
  ): Promise<void> {
    await this.postCall(this.addClientRoot("form-submission"), payload);
  }
}
