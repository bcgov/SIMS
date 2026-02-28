import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionConfigurationsAPIOutDTO,
  FormSubmissionAPIInDTO,
  FormSupplementaryDataAPIInDTO,
  FormSupplementaryDataAPIOutDTO,
  FormSubmissionPendingSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { PaginationOptions } from "@/types";

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
   * @param payload form submission with one or more form items.
   */
  async submitForm(payload: FormSubmissionAPIInDTO): Promise<void> {
    await ApiClient.FormSubmissionApi.submitForm(payload);
  }

  /**
   * Gets all pending form submissions for ministry review.
   * @param paginationOptions options to execute the pagination.
   * @returns paginated list of pending form submissions.
   */
  async getPendingFormSubmissions(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<FormSubmissionPendingSummaryAPIOutDTO>> {
    return ApiClient.FormSubmissionApi.getPendingFormSubmissions(
      paginationOptions,
    );
  }
}
