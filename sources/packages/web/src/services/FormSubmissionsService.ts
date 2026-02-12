import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionConfigurationsAPIOutDTO,
} from "@/services/http/dto/FormSubmission.dto";

export class FormSubmissionsService {
  // Share Instance
  private static instance: FormSubmissionsService;

  static get shared(): FormSubmissionsService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get all submission form configurations for student submission forms.
   * @returns form configurations that allow student submissions.
   */
  async getSubmissionForms(): Promise<FormSubmissionConfigurationsAPIOutDTO> {
    return ApiClient.FormSubmissionApi.getSubmissionForms();
  }

  // TODO: To be implemented.
  async getFormSubmissionSummary(): Promise<FormSubmissionStudentSummaryAPIOutDTO> {
    return ApiClient.FormSubmissionApi.getFormSubmissionSummary();
  }

  // TODO: To be implemented.
  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO> {
    return ApiClient.FormSubmissionApi.getFormSubmission(formSubmissionId);
  }
}
