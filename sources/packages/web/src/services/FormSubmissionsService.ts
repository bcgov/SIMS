import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionStudentSummaryAPIOutDTO,
} from "@/services/http/dto/FormSubmission.dto";

export class FormSubmissionsService {
  // Share Instance
  private static instance: FormSubmissionsService;

  static get shared(): FormSubmissionsService {
    return this.instance || (this.instance = new this());
  }

  async getFormSubmissionSummary(): Promise<FormSubmissionStudentSummaryAPIOutDTO> {
    return ApiClient.FormSubmissions.getFormSubmissionSummary();
  }

  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO | FormSubmissionMinistryAPIOutDTO> {
    return ApiClient.FormSubmissions.getFormSubmission(formSubmissionId);
  }

  async submitForm(payload: FormSubmissionAPIInDTO): Promise<void> {
    await ApiClient.FormSubmissions.submitForm(payload);
  }

  async submitItemDecision(
    formSubmissionItemId: number,
    payload: FormSubmissionItemDecisionAPIInDTO,
  ): Promise<void> {
    await ApiClient.FormSubmissions.submitItemDecision(
      formSubmissionItemId,
      payload,
    );
  }

  async completeFormSubmission(formSubmissionId: number): Promise<void> {
    await ApiClient.FormSubmissions.completeFormSubmission(formSubmissionId);
  }
}
