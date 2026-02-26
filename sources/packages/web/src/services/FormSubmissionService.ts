import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionConfigurationsAPIOutDTO,
  FormSubmissionAPIInDTO,
  FormSupplementaryDataAPIInDTO,
  FormSupplementaryDataAPIOutDTO,
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionCompletionAPIInDTO,
  FormSubmissionStudentAPIOutDTO,
} from "@/services/http/dto";

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
  async getFormSubmissionSummary(): Promise<{
    submissions: FormSubmissionStudentAPIOutDTO[];
  }> {
    return ApiClient.FormSubmissionApi.getFormSubmissionSummary();
  }

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * For the ministry, it is using during the approval process, providing the necessary details for
   * the decision making on each form item.
   * For the student, it is used to show the details of their submission, including the decision made
   * on each form item.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * for Ministry users to review and make decisions on each form item, also providing the data
   * for visualization of the form submission details.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @param options.
   * - `itemId`: optional ID of the form submission item to filter the details for.
   * @returns form submission details including individual form items and their details.
   */
  async getFormSubmission(
    formSubmissionId: number,
    options?: { itemId?: number },
  ): Promise<FormSubmissionStudentAPIOutDTO | FormSubmissionMinistryAPIOutDTO> {
    return ApiClient.FormSubmissionApi.getFormSubmission(formSubmissionId, {
      itemId: options?.itemId,
    });
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
   * Updates an individual form item in the form submission with the decision made by the Ministry, including the decision status and note.
   * @param formSubmissionItemId ID of the form submission item to update the decision for.
   * @param payload decision status and note description for the form submission item.
   */
  async submitItemDecision(
    formSubmissionItemId: number,
    payload: FormSubmissionItemDecisionAPIInDTO,
  ): Promise<void> {
    await ApiClient.FormSubmissionApi.submitItemDecision(
      formSubmissionItemId,
      payload,
    );
  }

  /**
   * Updates the form submission status to completed when all the related form items have been decided,
   * and executes the related business logic such as sending notification.
   * This is the final step of the form submission approval process for the Ministry, which indicates that
   * all decisions on the form items have been made and the form submission is completed.
   * @param formSubmissionId ID of the form submission to be completed.
   * @param payload form submission completion details.
   */
  async completeFormSubmission(
    formSubmissionId: number,
    payload: FormSubmissionCompletionAPIInDTO,
  ): Promise<void> {
    await ApiClient.FormSubmissionApi.completeFormSubmission(
      formSubmissionId,
      payload,
    );
  }
}
