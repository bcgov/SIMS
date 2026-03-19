import { Injectable, NotFoundException } from "@nestjs/common";
import {
  FormSubmissionService,
  hasFormSubmissionApprovalAuthorization,
} from "../../services";
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
import { Role } from "../../auth";

@Injectable()
export class FormSubmissionControllerService {
  constructor(private readonly formSubmissionService: FormSubmissionService) {}

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param studentId ID of the student to have the data retrieved.
   * @param options.
   * - `formSubmissionId` allow searching for a specific form submission. When provided, it will validate if the form
   * submission belongs to the student and throw a not found HTTP error if it does not.
   * - `locationIds` restrict forms with an application scope to the provided locations. Used for institutions to have access
   * only to the form submissions related to the locations they have access to.
   * - `userRoles` when provided, it will be used to determine the access to the decision details
   * that the consumer has based on their roles and the form category.
   * - `includeBasicDecisionDetails` optional flag to include basic decision details, besides
   * the decision status. Used for institutions to have access to more details than the student
   * to better support them. Default to false when not provided to expose less information. When keepPendingDecisionsWhilePendingFormSubmission
   * is true, the decision details will not be included while the form submission is pending to avoid showing non-final decisions
   * to be exposed.
   * - `loadSubmittedData` includes the submitted data of each form item.
   * @returns form submission details including individual form items and their details.
   * @throws NotFoundException when the formSubmissionId is provided but no record is returned.
   */
  async getFormSubmissions(
    studentId: number,
    options?: {
      formSubmissionId?: number;
      locationIds?: number[];
      includeBasicDecisionDetails?: boolean;
      loadSubmittedData?: boolean;
      userRoles?: Role[];
    },
  ): Promise<FormSubmissionAPIOutDTO[]> {
    const submissions = await this.formSubmissionService.getFormSubmissions(
      { studentId, formSubmissionId: options?.formSubmissionId },
      {
        locationIds: options?.locationIds,
        loadSubmittedData: options?.loadSubmittedData,
      },
    );
    if (options?.formSubmissionId && !submissions?.length) {
      throw new NotFoundException(
        `Form submission with ID ${options?.formSubmissionId} not found.`,
      );
    }

    // Set default value for the options that define how data will be returned considering the
    // default behavior to expose less information and avoid showing non-final decisions.
    const includeBasicDecisionDetails =
      options?.includeBasicDecisionDetails ?? false;
    return submissions.map((submission) =>
      this.mapSubmissionsToAPIOutDTO(
        submission,
        includeBasicDecisionDetails,
        options?.userRoles,
      ),
    );
  }

  /**
   * Convert a form submission record to the API output format,
   * including the individual form items and their details.
   * @param submission form submission record to be converted.
   * @param includeBasicDecisionDetails flag to indicate if the basic decision details should be included in the response,
   * besides the status that is always included.
   * @param userRoles roles of the user to determine access to decision details.
   * @returns form submission details including individual form items and their details in the API output format.
   */
  private mapSubmissionsToAPIOutDTO(
    submission: FormSubmission,
    includeBasicDecisionDetails: boolean,
    userRoles?: Role[],
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
          includeBasicDecisionDetails,
          userRoles,
        ),
      })),
    };
  }

  /**
   * Define the decision to be returned.
   * The decision and its details are determined based on the form submission status
   * and the access to the decision details that the consumer has.
   * Used for students and institutions that have different access to the decision details,
   * and for Ministry users with limited access to the decision details.
   * @param submissionStatus form submission status.
   * @param submissionItem form submission to determine the decision details to be returned.
   * @param includeBasicDecisionDetails flag to indicate if the basic decision details should be included in the response,
   * besides the status that is always included.
   * @returns the decision that must be exposed the consumer.
   */
  mapCurrentDecision(
    submissionStatus: FormSubmissionStatus,
    submissionItem: FormSubmissionItem,
    includeBasicDecisionDetails: boolean,
    userRoles?: Role[],
  ): FormSubmissionItemDecisionAPIOutDTO {
    // Determine if decision details should be restricted based on the form submission status and the flag.
    const shouldRestrictDecisionDetails =
      !hasFormSubmissionApprovalAuthorization(
        submissionItem.dynamicFormConfiguration.formCategory,
        userRoles,
      ) && submissionStatus === FormSubmissionStatus.Pending;
    // Define the status.
    let decisionStatus = shouldRestrictDecisionDetails
      ? FormSubmissionDecisionStatus.Pending
      : submissionItem.currentDecision?.decisionStatus;
    decisionStatus = decisionStatus ?? FormSubmissionDecisionStatus.Pending;
    // Define the notes.
    const decisionNoteDescription =
      shouldRestrictDecisionDetails || !includeBasicDecisionDetails
        ? undefined
        : submissionItem.currentDecision?.decisionNote?.description;
    return {
      decisionStatus,
      decisionNoteDescription,
    };
  }
}
