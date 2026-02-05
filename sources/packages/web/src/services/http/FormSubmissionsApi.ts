import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionAPIInDTO,
  FormSubmissionFinalDecisionAPIInDTO,
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
} from "@/services/http/dto";

/**
 * Http API client for Form Submissions.
 */
export class FormSubmissionsApi extends HttpBaseClient {
  async getFormSubmissionSummary(): Promise<FormSubmissionStudentSummaryAPIOutDTO> {
    return this.getCall(this.addClientRoot("form-submission"));
  }

  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO | FormSubmissionMinistryAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(`form-submission/${formSubmissionId}`),
    );
  }

  async submitForm(payload: FormSubmissionAPIInDTO): Promise<void> {
    await this.postCall(this.addClientRoot("form-submission"), payload);
  }

  async submitItemDecision(
    formSubmissionId: number,
    payload: FormSubmissionItemDecisionAPIInDTO,
  ): Promise<void> {
    await this.putCall(
      this.addClientRoot(`form-submission/${formSubmissionId}/items`),
      payload,
    );
  }

  async submitFinalDecision(
    formSubmissionId: number,
    payload: FormSubmissionFinalDecisionAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`form-submission/${formSubmissionId}`),
      payload,
    );
  }
}
