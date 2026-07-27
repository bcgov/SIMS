import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  FormSubmissionAuthRoles,
  FormSubmissionService,
  FormSubmissionAuthorizationService,
  FormSubmissionUserRolesAuth,
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
  FormSubmissionItemDecisionMinistryAPIOutDTO,
  FormSubmissionItemMinistryAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "./models/form-submission.dto";
import { Role } from "../../auth";
import { getUserFullName } from "../../utilities";

@Injectable()
export class FormSubmissionControllerService {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formSubmissionAuthorizationService: FormSubmissionAuthorizationService,
  ) {}

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param studentId ID of the student to have the data retrieved.
   * @param options.
   * - `formSubmissionId` allow searching for a specific form submission. When provided, it will validate if the form
   * submission belongs to the student and throw a not found HTTP error if it does not.
   * - `locationIds` restrict forms with an application scope to the provided locations. Used for institutions to have access
   * only to the form submissions related to the locations they have access to.
   * - `loadSubmittedData` includes the submitted data of each form item. Students should have access to their submitted data,
   * but institution users should not have access to this information.
   * - `userRoles` when provided, it will be used to determine the access to the forms details that the consumer has based on their roles.
   * @returns form submission details including individual form items and their details.
   * @throws NotFoundException when the formSubmissionId is provided but no record is returned.
   */
  async getFormSubmissions(
    studentId: number,
    options?: {
      formSubmissionId?: number;
      locationIds?: number[];
      loadSubmittedData?: boolean;
      userRoles?: Role[];
    },
  ): Promise<FormSubmissionAPIOutDTO[]> {
    let dynamicFormsIDs: number[] | undefined = undefined;
    let formsUserRoles: FormSubmissionUserRolesAuth | undefined = undefined;
    if (options?.userRoles) {
      formsUserRoles =
        this.formSubmissionAuthorizationService.getFormsUserRoles(
          options.userRoles,
        );
      dynamicFormsIDs = formsUserRoles.getAuthorizedDynamicFormsIDs(
        FormSubmissionAuthRoles.ViewFormHistoryList,
      );
    }
    const submissions = await this.formSubmissionService.getFormSubmissions(
      { studentId, formSubmissionId: options?.formSubmissionId },
      {
        locationIds: options?.locationIds,
        loadSubmittedData: options?.loadSubmittedData,
        dynamicFormsIDs,
      },
    );
    if (options?.formSubmissionId && !submissions?.length) {
      throw new NotFoundException(
        `Form submission with ID ${options?.formSubmissionId} not found.`,
      );
    }
    return submissions.map((submission) =>
      this.mapSubmissionsToAPIOutDTO(submission, formsUserRoles),
    );
  }

  /**
   * Convert a form submission record to the API output format,
   * including the individual form items and their details.
   * @param submission form submission record to be converted.
   * @param formsUserRoles when provided, it will be used to determine the access to the forms details that
   * the consumer has based on their roles.
   * @returns form submission details including individual form items and their details in the API output format.
   */
  private mapSubmissionsToAPIOutDTO(
    submission: FormSubmission,
    formsUserRoles?: FormSubmissionUserRolesAuth,
  ): FormSubmissionAPIOutDTO {
    let canViewFormSubmittedData: boolean | undefined = undefined;
    if (formsUserRoles) {
      const dynamicFormConfigurationIDs = submission.formSubmissionItems.map(
        (item) => item.dynamicFormConfiguration.id,
      );
      canViewFormSubmittedData = formsUserRoles.isAuthorized(
        FormSubmissionAuthRoles.ViewFormSubmittedData,
        dynamicFormConfigurationIDs,
        { atLeastOneAuthorized: true },
      );
    }
    // Check if any of the submission items have a decision made, which would prevent the submission from being cancelled.
    const hasAnySubmissionItemWithDecision =
      submission.formSubmissionItems.some((item) => !!item.currentDecision?.id);
    return {
      canViewFormSubmittedData,
      canCancelSubmission:
        submission.submissionStatus === FormSubmissionStatus.Pending &&
        !hasAnySubmissionItemWithDecision,
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      submittedDate: submission.submittedDate,
      assessedDate: submission.assessedDate,
      statusUpdatedDate: submission.submissionStatusUpdatedOn,
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
          formsUserRoles,
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
   * @param formsUserRoles when provided, it will be used to determine the access to the forms details that
   * the consumer has based on their roles.
   * @returns the decision that must be exposed the consumer.
   */
  mapCurrentDecision(
    submissionStatus: FormSubmissionStatus,
    submissionItem: FormSubmissionItem,
    formsUserRoles?: FormSubmissionUserRolesAuth,
  ): FormSubmissionItemDecisionAPIOutDTO {
    const canAssessItemDecision = formsUserRoles?.isAuthorized(
      FormSubmissionAuthRoles.AssessItemDecision,
      [submissionItem.dynamicFormConfiguration.id],
    );
    if (
      !submissionItem.currentDecision ||
      (submissionStatus === FormSubmissionStatus.Pending &&
        !canAssessItemDecision)
    ) {
      // When there is no decision or the submission is pending and the user has no permission to assess the item decision, return 'Pending'.
      return {
        decisionStatus: FormSubmissionDecisionStatus.Pending,
      };
    }
    return {
      decisionStatus: submissionItem.currentDecision.decisionStatus,
    };
  }

  /**
   * Get the details of a form submission for Ministry users, including the individual form items and their details.
   * The decision details that are returned are determined based on the access that the Ministry user has to the decision details.
   * @param formSubmissionId ID of the form submission to have the data retrieved.
   * @param userRoles roles of the user to determine access to decision details.
   * @param itemId when provided, it will validate if the form submission item belongs to the form submission and throw a not found HTTP error if it does not.
   * @returns form submission details including individual form items and their details in the API output format for Ministry users.
   */
  async getFormSubmission(
    formSubmissionId: number,
    userRoles: Role[],
    itemId?: number,
  ): Promise<FormSubmissionMinistryAPIOutDTO> {
    // Retrieve all the form submission items to be able correctly defined the value of
    // the canAssessFinalDecision property based on the form types included in the submission.
    const [submission] = await this.formSubmissionService.getFormSubmissions(
      { formSubmissionId, itemId },
      {
        includeDecisionHistory: true,
        loadSubmittedData: true,
      },
    );
    if (!submission) {
      if (itemId) {
        throw new NotFoundException(
          `Form submission with ID ${formSubmissionId} and form submission item ID ${itemId} not found.`,
        );
      }
      throw new NotFoundException(
        `Form submission with ID ${formSubmissionId} not found.`,
      );
    }
    const formsUserRoles =
      this.formSubmissionAuthorizationService.getFormsUserRoles(userRoles);
    const submissionItems: FormSubmissionItemMinistryAPIOutDTO[] = [];
    for (const formSubmissionItem of submission.formSubmissionItems) {
      const canViewFormSubmittedData = formsUserRoles.isAuthorized(
        FormSubmissionAuthRoles.ViewFormSubmittedData,
        [formSubmissionItem.dynamicFormConfiguration.id],
      );
      if (!canViewFormSubmittedData) {
        continue;
      }
      const canViewDecisionHistory = formsUserRoles.isAuthorized(
        FormSubmissionAuthRoles.ViewDecisionHistory,
        [formSubmissionItem.dynamicFormConfiguration.id],
      );
      const canAssessItemDecision = formsUserRoles.isAuthorized(
        FormSubmissionAuthRoles.AssessItemDecision,
        [formSubmissionItem.dynamicFormConfiguration.id],
      );
      const submissionItemDTO: FormSubmissionItemMinistryAPIOutDTO = {
        canAssessItemDecision,
        id: formSubmissionItem.id,
        formType: formSubmissionItem.dynamicFormConfiguration.formType,
        formCategory: formSubmissionItem.dynamicFormConfiguration.formCategory,
        dynamicFormConfigurationId:
          formSubmissionItem.dynamicFormConfiguration.id,
        submissionData: formSubmissionItem.submittedData,
        formDefinitionName:
          formSubmissionItem.dynamicFormConfiguration.formDefinitionName,
        updatedAt: formSubmissionItem.updatedAt,
        currentDecision: this.mapCurrentDecisionExtended(
          submission.submissionStatus,
          formSubmissionItem,
          canAssessItemDecision,
        ),
        previousDecisions: canViewDecisionHistory
          ? formSubmissionItem.decisions
              .filter(
                (decision) =>
                  decision.id !== formSubmissionItem.currentDecision!.id,
              )
              .map((decision) => ({
                id: decision.id,
                decisionStatus: decision.decisionStatus,
                decisionDate: decision.decisionDate,
                decisionBy: getUserFullName(decision.decisionBy),
                decisionNoteDescription: decision.decisionNote.description,
              }))
          : undefined,
      };
      submissionItems.push(submissionItemDTO);
    }
    if (!submissionItems.length) {
      throw new ForbiddenException(
        `The user does not have access to any form submission items for submission ID ${formSubmissionId}.`,
      );
    }
    const dynamicFormsIDs = submission.formSubmissionItems.map(
      (item) => item.dynamicFormConfiguration.id,
    );
    // If the request is for a specific item, refrain from returning the canAssessFinalDecision property as it
    // is only relevant when assessing the entire submission and not a specific item.
    const canAssessFinalDecision = itemId
      ? undefined
      : formsUserRoles.isAuthorized(
          FormSubmissionAuthRoles.AssessFinalDecision,
          dynamicFormsIDs,
        );
    return {
      canAssessFinalDecision,
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      submittedDate: submission.submittedDate,
      studentId: submission.student.id,
      studentFullName: getUserFullName(submission.student.user),
      submissionItems,
    };
  }

  /**
   * Map the current decision for the Ministry users based on their authorization to view
   * the decision details and the form submission status.
   * @param submissionStatus form submission status.
   * @param submissionItem form submission item to determine the decision details to be returned.
   * @param canAssessItemDecision indicates if the user has authorization to assess the item decision.
   * @returns the decision that must be exposed to Ministry users based on their authorization and
   * the form submission status.
   */
  mapCurrentDecisionExtended(
    submissionStatus: FormSubmissionStatus,
    submissionItem: FormSubmissionItem,
    canAssessItemDecision: boolean,
  ): FormSubmissionItemDecisionMinistryAPIOutDTO {
    if (!submissionItem.currentDecision) {
      // Default when no decision has been made yet.
      return {
        decisionStatus: FormSubmissionDecisionStatus.Pending,
      };
    }
    if (canAssessItemDecision) {
      // Return decision details entirely for users that can assess the item decision.
      return {
        id: submissionItem.currentDecision.id,
        decisionStatus:
          submissionItem.currentDecision?.decisionStatus ??
          FormSubmissionDecisionStatus.Pending,
        decisionDate: submissionItem.currentDecision.decisionDate,
        decisionBy: getUserFullName(submissionItem.currentDecision.decisionBy),
        decisionNoteDescription:
          submissionItem.currentDecision.decisionNote.description,
      };
    }
    // When user does not have access to see the decision details,
    // return the decision based on the form submission status.
    if (submissionStatus !== FormSubmissionStatus.Pending) {
      // Status and notes should be available to all Ministry users when a final decision was made.
      return {
        decisionStatus: submissionItem.currentDecision.decisionStatus,
        decisionNoteDescription:
          submissionItem.currentDecision.decisionNote.description,
      };
    }
    // Default when the user has no access to see non-completed submissions.
    return {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
    };
  }
}
