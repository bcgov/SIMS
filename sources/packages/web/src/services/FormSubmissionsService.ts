import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionStudentSummaryAPIOutDTO,
  SubmissionFormConfigurationsAPIOutDTO,
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
  async getSubmissionForms(): Promise<SubmissionFormConfigurationsAPIOutDTO> {
    return ApiClient.FormSubmissions.getSubmissionForms();
  }

  async getFormSubmissionSummary(): Promise<FormSubmissionStudentSummaryAPIOutDTO> {
    return ApiClient.FormSubmissions.getFormSubmissionSummary();
  }

  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO> {
    return ApiClient.FormSubmissions.getFormSubmission(formSubmissionId);
  }
}
