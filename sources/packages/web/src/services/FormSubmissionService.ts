import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionConfigurationsAPIOutDTO,
  FormSubmissionAPIInDTO,
  FormSupplementaryDataAPIInDTO,
  FormSupplementaryDataAPIOutDTO,
} from "@/services/http/dto/FormSubmission.dto";

export class FormSubmissionService {
  // Share Instance
  private static instance: FormSubmissionService;

  static get shared(): FormSubmissionService {
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

  /**
   * Get supplementary data for the given data keys and application ID if provided.
   * @param query data keys and application ID to retrieve the supplementary data for.
   * @returns supplementary data for the given data keys and application ID.
   */
  async getSupplementaryData(
    query: FormSupplementaryDataAPIInDTO,
  ): Promise<FormSupplementaryDataAPIOutDTO> {
    return ApiClient.FormSubmissionApi.getSupplementaryData(query);
  }

  /**
   * Submits forms represents appeals or other students forms for Ministry's decision.
   * The submission will be processed based on the form category and the related business rules.
   * @param userToken user token of the student submitting the forms.
   * @param payload form submission with one or more form items.
   * @returns the id of the created form submission record that holds all the individual form items.
   */
  async submitForm(payload: FormSubmissionAPIInDTO): Promise<void> {
    return ApiClient.FormSubmissionApi.submitForm(payload);
  }
}
