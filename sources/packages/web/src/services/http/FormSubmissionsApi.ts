import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
  SubmissionFormConfigurationsAPIOutDTO,
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

  /**
   * Get all submission form configurations for student submission forms.
   * @returns form configurations that allow student submissions.
   */
  async getSubmissionForms(): Promise<SubmissionFormConfigurationsAPIOutDTO> {
    return this.getCall(this.addClientRoot("form-submission/forms"));
  }
}
