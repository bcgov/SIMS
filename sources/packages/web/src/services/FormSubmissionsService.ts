import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionFinalDecisionAPIInDTO,
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
    formSubmissionId: number,
    payload: FormSubmissionItemDecisionAPIInDTO,
  ): Promise<void> {
    await ApiClient.FormSubmissions.submitItemDecision(
      formSubmissionId,
      payload,
    );
  }

  async submitFinalDecision(
    formSubmissionId: number,
    payload: FormSubmissionFinalDecisionAPIInDTO,
  ): Promise<void> {
    await ApiClient.FormSubmissions.submitFinalDecision(
      formSubmissionId,
      payload,
    );
  }
}
