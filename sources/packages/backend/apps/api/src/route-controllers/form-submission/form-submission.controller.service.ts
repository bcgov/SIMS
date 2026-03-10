import { Injectable, NotFoundException } from "@nestjs/common";
import { FormSubmissionService } from "../../services";
import {
  FormSubmission,
  FormSubmissionDecisionStatus,
  FormSubmissionItem,
  FormSubmissionStatus,
} from "@sims/sims-db";
import {
  FormSubmissionAPIOutDTO,
  FormSubmissionItemDecisionAPIOutDTO,
} from "./models/form-submission.dto";

@Injectable()
export class FormSubmissionControllerService {
  constructor(private readonly formSubmissionService: FormSubmissionService) {}

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @param studentId ID used to validate the access to the student data.
   * @param options.
   * - `includeBasicDecisionDetails`: optional flag to include basic decision details, besides
   * the decision status. Used for institutions to have access to more details than the student
   * to better support them.
   * - `applicationId`: optional ID of the application, used to validate the access to the form submission
   * @returns form submission details.
   */
  async getFormSubmissions(
    studentId: number,
    options?: {
      formSubmissionId?: number;
      locationIds?: number[];
      includeBasicDecisionDetails?: boolean;
      keepPendingDecisionsWhilePendingFormSubmission?: boolean;
    },
  ): Promise<FormSubmissionAPIOutDTO[]> {
    const submissions = await this.formSubmissionService.getFormSubmissions(
      studentId,
      {
        formSubmissionId: options?.formSubmissionId,
        locationIds: options?.locationIds,
      },
    );
    if (options?.formSubmissionId && !submissions?.length) {
      throw new NotFoundException(
        `Form submission with ID ${options?.formSubmissionId} not found.`,
      );
    }
    return submissions.map((submission) =>
      this.mapSubmissionsToAPIOutDTO(submission, {
        includeBasicDecisionDetails: options?.includeBasicDecisionDetails,
        keepPendingDecisionsWhilePendingFormSubmission:
          options?.keepPendingDecisionsWhilePendingFormSubmission,
      }),
    );
  }

  private mapSubmissionsToAPIOutDTO(
    submission: FormSubmission,
    options?: {
      includeBasicDecisionDetails?: boolean;
      keepPendingDecisionsWhilePendingFormSubmission?: boolean;
    },
  ): FormSubmissionAPIOutDTO {
    return {
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      submittedDate: submission.submittedDate,
      assessedDate: submission.assessedDate,
      submissionItems: submission.formSubmissionItems.map((item) => ({
        id: item.id,
        formType: item.dynamicFormConfiguration.formType,
        formCategory: item.dynamicFormConfiguration.formCategory,
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
        currentDecision: this.mapCurrentDecision(
          submission.submissionStatus,
          item,
          options?.includeBasicDecisionDetails ?? false,
          options?.keepPendingDecisionsWhilePendingFormSubmission ?? true,
        ),
      })),
    };
  }

  /**
   * Define the decision to be returned.
   * The decision and its details are determined based on the form submission status
   * and the access to the decision details that the consumer has.
   * @param submissionStatus form submission status.
   * @param submissionItem form submission to determine the decision details to be returned.
   * @param includeBasicDecisionDetails flag to indicate if the basic decision details should be included in the response,
   * besides the status that is always included.
   * @returns the decision that must be exposed the consumer.
   */
  private mapCurrentDecision(
    submissionStatus: FormSubmissionStatus,
    submissionItem: FormSubmissionItem,
    includeBasicDecisionDetails: boolean,
    keepPendingDecisionsWhilePendingFormSubmission: boolean,
  ): FormSubmissionItemDecisionAPIOutDTO {
    let decisionStatus =
      keepPendingDecisionsWhilePendingFormSubmission &&
      submissionStatus === FormSubmissionStatus.Pending
        ? FormSubmissionDecisionStatus.Pending
        : submissionItem.currentDecision?.decisionStatus;
    // Default to Pending if no decision exists.
    decisionStatus = decisionStatus ?? FormSubmissionDecisionStatus.Pending;
    return {
      decisionStatus: decisionStatus,
      decisionNoteDescription: includeBasicDecisionDetails
        ? submissionItem.currentDecision?.decisionNote?.description
        : undefined,
    };
  }
}
