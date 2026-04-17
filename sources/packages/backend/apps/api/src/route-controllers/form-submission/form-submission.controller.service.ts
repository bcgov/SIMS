import { Injectable, NotFoundException } from "@nestjs/common";
import {
  FormSubmissionAuthRoles,
  FormSubmissionService,
  FormSubmissionAuthorizationService,
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
   * - `userRoles` when provided, it will be used to determine the access to the decision details
   * that the consumer has based on their roles.
   * - `loadSubmittedData` includes the submitted data of each form item. Students should have access to their submitted data,
   * but institution users should not have access to this information.
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
    if (options?.userRoles) {
      dynamicFormsIDs =
        this.formSubmissionAuthorizationService.getAuthorizedDynamicFormsIDs(
          options.userRoles,
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
      this.mapSubmissionsToAPIOutDTO(submission, options?.userRoles),
    );
  }

  /**
   * Convert a form submission record to the API output format,
   * including the individual form items and their details.
   * @param submission form submission record to be converted.
   * @param userRoles roles of the user to determine access to decision details.
   * @returns form submission details including individual form items and their details in the API output format.
   */
  private mapSubmissionsToAPIOutDTO(
    submission: FormSubmission,
    userRoles?: Role[],
  ): FormSubmissionAPIOutDTO {
    let canViewFormSubmittedData: boolean | undefined = undefined;
    if (userRoles) {
      const items = submission.formSubmissionItems.map(
        (item) => item.dynamicFormConfiguration.id,
      );
      canViewFormSubmittedData =
        this.formSubmissionAuthorizationService.isAuthorized(
          userRoles,
          FormSubmissionAuthRoles.ViewFormSubmittedData,
          items,
          { isAuthorizedToAtLeastOne: true },
        );
    }
    return {
      canViewFormSubmittedData,
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
   * @returns the decision that must be exposed the consumer.
   */
  mapCurrentDecision(
    submissionStatus: FormSubmissionStatus,
    submissionItem: FormSubmissionItem,
    userRoles?: Role[],
  ): FormSubmissionItemDecisionAPIOutDTO {
    // Define the authorization to assess item decisions based on the form item configuration and user roles.
    const hasAssessItemDecisionAuthorization =
      userRoles &&
      this.formSubmissionAuthorizationService.isAuthorized(
        userRoles,
        FormSubmissionAuthRoles.AssessItemDecision,
        [submissionItem.dynamicFormConfiguration.id],
      );
    // Determine if decision details should be restricted based on the form submission status.
    const shouldRestrictDecisionDetails =
      !hasAssessItemDecisionAuthorization &&
      submissionStatus === FormSubmissionStatus.Pending;
    // Define the status.
    let decisionStatus = shouldRestrictDecisionDetails
      ? FormSubmissionDecisionStatus.Pending
      : submissionItem.currentDecision?.decisionStatus;
    decisionStatus = decisionStatus ?? FormSubmissionDecisionStatus.Pending;
    return {
      decisionStatus,
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
    const authorizedDynamicFormsIDs =
      this.formSubmissionAuthorizationService.getAuthorizedDynamicFormsIDs(
        userRoles,
        FormSubmissionAuthRoles.ViewFormSubmittedData,
      );
    const [submission] = await this.formSubmissionService.getFormSubmissions(
      { formSubmissionId, itemId },
      {
        includeDecisionHistory: true,
        loadSubmittedData: true,
        dynamicFormsIDs: authorizedDynamicFormsIDs,
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
    const dynamicFormsIDs = submission.formSubmissionItems.map(
      (item) => item.dynamicFormConfiguration.id,
    );
    const hasAssessFinalDecisionAuthorization =
      this.formSubmissionAuthorizationService.isAuthorized(
        userRoles,
        FormSubmissionAuthRoles.AssessFinalDecision,
        dynamicFormsIDs,
      );

    const submissionItems: FormSubmissionItemMinistryAPIOutDTO[] = [];
    for (const formSubmissionItem of submission.formSubmissionItems) {
      const hasViewDecisionHistory =
        this.formSubmissionAuthorizationService.isAuthorized(
          userRoles,
          FormSubmissionAuthRoles.ViewDecisionHistory,
          [formSubmissionItem.dynamicFormConfiguration.id],
        );
      const hasAssessItemDecisionAuthorization =
        this.formSubmissionAuthorizationService.isAuthorized(
          userRoles,
          FormSubmissionAuthRoles.AssessItemDecision,
          [formSubmissionItem.dynamicFormConfiguration.id],
        );
      const submissionItemDTO: FormSubmissionItemMinistryAPIOutDTO = {
        hasAssessItemDecisionAuthorization,
        id: formSubmissionItem.id,
        formType: formSubmissionItem.dynamicFormConfiguration.formType,
        formCategory: formSubmissionItem.dynamicFormConfiguration.formCategory,
        dynamicFormConfigurationId:
          formSubmissionItem.dynamicFormConfiguration.id,
        submissionData: formSubmissionItem.submittedData,
        formDefinitionName:
          formSubmissionItem.dynamicFormConfiguration.formDefinitionName,
        updatedAt: formSubmissionItem.updatedAt,
        currentDecision:
          formSubmissionItem.currentDecision &&
          hasAssessItemDecisionAuthorization
            ? {
                id: formSubmissionItem.currentDecision.id,
                decisionStatus:
                  formSubmissionItem.currentDecision?.decisionStatus ??
                  FormSubmissionDecisionStatus.Pending,
                decisionDate: formSubmissionItem.currentDecision.decisionDate,
                decisionBy: getUserFullName(
                  formSubmissionItem.currentDecision.decisionBy,
                ),
                decisionNoteDescription:
                  formSubmissionItem.currentDecision.decisionNote.description,
              }
            : this.mapCurrentDecision(
                submission.submissionStatus,
                formSubmissionItem,
                userRoles,
              ),
        previousDecisions: hasViewDecisionHistory
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
    return {
      hasAssessFinalDecisionAuthorization,
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      submittedDate: submission.submittedDate,
      submissionItems,
    };
  }
}
