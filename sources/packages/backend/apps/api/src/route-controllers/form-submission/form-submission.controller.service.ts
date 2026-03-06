import { Injectable, NotFoundException } from "@nestjs/common";
import { FormSubmissionService } from "../../services";
import {
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
} from "@sims/sims-db";
import { FormSubmissionAPIOutDTO } from "./models/form-submission.dto";

@Injectable()
export class FormSubmissionControllerService {
  constructor(private readonly formSubmissionService: FormSubmissionService) {}

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @param options.
   * - `studentId`: optional ID used to validate the institution access to the student data.
   * - `includeBasicDecisionDetails`: optional flag to include basic decision details, besides
   * the decision status. Used for institutions to have access to more details than the student
   * to better support them.
   * @returns form submission details.
   */
  async getFormSubmission(
    formSubmissionId: number,
    studentId: number,
    options?: {
      includeBasicDecisionDetails?: boolean;
    },
  ): Promise<FormSubmissionAPIOutDTO> {
    const submission = await this.formSubmissionService.getFormSubmissionsById(
      formSubmissionId,
      studentId,
    );
    if (!submission) {
      throw new NotFoundException(
        `Form submission with ID ${formSubmissionId} not found.`,
      );
    }
    return {
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      submittedDate: submission.submittedDate,
      submissionItems: submission.formSubmissionItems.map((item) => ({
        id: item.id,
        formType: item.dynamicFormConfiguration.formType,
        formCategory: item.dynamicFormConfiguration.formCategory,
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
        currentDecision: options?.includeBasicDecisionDetails
          ? {
              decisionStatus: this.mapFormSubmissionDecisionStatus(
                submission.submissionStatus,
                item.currentDecision?.decisionStatus,
              ),
              decisionNoteDescription:
                item.currentDecision?.decisionNote.description,
            }
          : {
              decisionStatus: this.mapFormSubmissionDecisionStatus(
                submission.submissionStatus,
                item.currentDecision?.decisionStatus,
              ),
            },
      })),
    };
  }

  /**
   * Define the decision status to be returned.
   * The decision status is determined based on the form submission status and the current decision item status.
   * For certain scenarios, such as when the form submission is still pending, it may be desirable to keep the decision status
   * as pending even if there is a decision item with a final decision.
   * @param submissionStatus form submission status.
   * @param decisionItemStatus form item decision status.
   * @returns the decision status to be returned.
   */
  private mapFormSubmissionDecisionStatus(
    submissionStatus: FormSubmissionStatus,
    decisionItemStatus: FormSubmissionDecisionStatus | undefined,
  ): FormSubmissionDecisionStatus {
    if (submissionStatus === FormSubmissionStatus.Pending) {
      return FormSubmissionDecisionStatus.Pending;
    }
    return decisionItemStatus ?? FormSubmissionDecisionStatus.Pending;
  }
}
