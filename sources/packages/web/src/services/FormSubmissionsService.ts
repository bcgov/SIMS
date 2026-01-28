import ApiClient from "@/services/http/ApiClient";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionsAPIOutDTO,
} from "@/services/http/dto/FormSubmission.dto";

export class FormSubmissionsService {
  // Share Instance
  private static instance: FormSubmissionsService;

  static get shared(): FormSubmissionsService {
    return this.instance || (this.instance = new this());
  }

  async getFormSubmissionSummary(): Promise<FormSubmissionsAPIOutDTO> {
    return ApiClient.FormSubmissions.getFormSubmissionSummary();
  }

  async submitApplicationAppeal(
    payload: FormSubmissionAPIInDTO,
  ): Promise<void> {
    await ApiClient.FormSubmissions.submitApplicationAppeal(payload);
  }
}
