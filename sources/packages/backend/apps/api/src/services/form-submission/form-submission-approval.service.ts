import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Role } from "../../auth";
import {
  User,
  FormSubmission,
  FormSubmissionStatus,
  FormSubmissionItem,
  FormSubmissionDecisionStatus,
  Note,
  NoteType,
  FormCategory,
  FormSubmissionItemDecision,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import {
  FORM_SUBMISSION_DECISION_PENDING,
  FORM_SUBMISSION_ITEM_NOT_FOUND,
  FORM_SUBMISSION_ITEM_OUTDATED,
  FORM_SUBMISSION_NOT_FOUND,
  FORM_SUBMISSION_NOT_PENDING,
  FORM_SUBMISSION_UPDATE_UNAUTHORIZED,
} from "./constants";
import {
  FORM_SUBMISSION_APPROVAL_ROLES_MAP,
  FormSubmissionCompletionItem,
} from "./form-submission.models";
import { NoteSharedService } from "@sims/services";

@Injectable()
export class FormSubmissionApprovalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  /**
   * Gets a form submission by its ID, optionally filtering by student ID and form submission item ID.
   * @param formSubmissionId The ID of the form submission to retrieve.
   * @param options optional filters.
   * - `itemId`: if provided, returns only the form submission item with the specified ID in the
   * form submission items array.
   * @returns The form submission if found, otherwise null.
   */
  async getFormSubmissionsById(
    formSubmissionId: number,
    options?: { itemId?: number },
  ): Promise<FormSubmission | null> {
    return this.formSubmissionRepo.findOne({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
        assessedDate: true,
        formCategory: true,
        formSubmissionItems: {
          id: true,
          dynamicFormConfiguration: {
            id: true,
            formType: true,
            formCategory: true,
            formDefinitionName: true,
          },
          currentDecision: {
            id: true,
            decisionStatus: true,
            decisionDate: true,
            decisionBy: { id: true, firstName: true, lastName: true },
            decisionNote: { id: true, description: true },
          },
          decisions: {
            id: true,
            decisionStatus: true,
            decisionDate: true,
            decisionBy: { id: true, firstName: true, lastName: true },
            decisionNote: { id: true, description: true },
          },
          submittedData: true,
          updatedAt: true,
        },
      },
      relations: {
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          currentDecision: {
            decisionBy: true,
            decisionNote: true,
          },
          decisions: {
            decisionBy: true,
            decisionNote: true,
          },
        },
      },
      where: {
        id: formSubmissionId,
        formSubmissionItems: { id: options?.itemId },
      },
      order: { formSubmissionItems: { id: "ASC", decisions: { id: "DESC" } } },
    });
  }

  /**
   * Saves a decision to be associated with a form submission item, saving the decision
   * history and ensuring the necessary authorization and validations.
   * @param submissionItemId The ID of the form submission item being decided on.
   * @param decisionStatus The decision status to be associated with the form submission item.
   * @param noteDescription The description of the note to be associated with the decision.
   * @param lastUpdateDate The last update date of the form submission item,
   * used to validate against potential outdated information.
   * @param userRoles The roles of the user performing the action, used for authorization.
   * @param auditUserId The ID of the user performing the action, used for auditing purposes.
   */
  async saveFormSubmissionItem(
    submissionItemId: number,
    decisionStatus: FormSubmissionDecisionStatus,
    noteDescription: string,
    lastUpdateDate: Date,
    userRoles: Role[],
    auditUserId: number,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      const formSubmissionItemRepo =
        entityManager.getRepository(FormSubmissionItem);
      // Acquire a DB lock for the form submission item to prevent concurrent updates.
      await formSubmissionItemRepo.findOne({
        select: { id: true },
        where: { id: submissionItemId },
        lock: { mode: "pessimistic_write" },
      });
      const submissionItem = await formSubmissionItemRepo.findOne({
        select: {
          id: true,
          formSubmission: { id: true, submissionStatus: true },
          updatedAt: true,
          dynamicFormConfiguration: {
            id: true,
            formCategory: true,
          },
          currentDecision: {
            id: true,
            decisionStatus: true,
            decisionNote: { id: true },
          },
        },
        relations: {
          formSubmission: true,
          dynamicFormConfiguration: true,
          currentDecision: {
            decisionNote: true,
          },
        },
        where: { id: submissionItemId },
      });
      if (!submissionItem) {
        throw new CustomNamedError(
          `Form submission item with ID ${submissionItemId} not found.`,
          FORM_SUBMISSION_ITEM_NOT_FOUND,
        );
      }
      this.checkAuthorizationForApproval(
        submissionItem.dynamicFormConfiguration.formCategory,
        userRoles,
      );
      if (submissionItem.updatedAt.getTime() !== lastUpdateDate.getTime()) {
        throw new CustomNamedError(
          "The form submission item has been updated since it was last retrieved. Please refresh and try again.",
          FORM_SUBMISSION_ITEM_OUTDATED,
        );
      }
      if (
        submissionItem.formSubmission.submissionStatus !==
        FormSubmissionStatus.Pending
      ) {
        throw new CustomNamedError(
          "Decisions cannot be made on items belonging to a form submission that is not pending.",
          FORM_SUBMISSION_NOT_PENDING,
        );
      }
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      // Create a new decision history entry.
      const decision = new FormSubmissionItemDecision();
      decision.decisionStatus = decisionStatus;
      decision.decisionBy = auditUser;
      decision.decisionDate = now;
      decision.createdAt = now;
      decision.creator = auditUser;
      // Create decision note.
      const note = new Note();
      note.description = noteDescription;
      // TODO: Create a note type for Forms.
      note.noteType = NoteType.General;
      note.creator = auditUser;
      note.createdAt = now;
      decision.decisionNote = await entityManager
        .getRepository(Note)
        .save(note);
      // Update submission item.
      decision.formSubmissionItem = submissionItem;
      submissionItem.currentDecision = decision;
      submissionItem.modifier = auditUser;
      submissionItem.updatedAt = now;
      await formSubmissionItemRepo.save(submissionItem);
    });
  }

  /**
   * Marks the form submission as completed or declined based on the decisions on individual form items.
   * @param submissionId The ID of the form submission to complete.
   * @param items The list of form submission items with their last update date to validate against
   * potential outdated information.
   * @param userRoles The roles of the user performing the action, used for authorization.
   * @param auditUserId The ID of the user performing the action.
   * @returns The updated form submission.
   */
  async completeFormSubmission(
    submissionId: number,
    items: FormSubmissionCompletionItem[],
    userRoles: Role[],
    auditUserId: number,
  ): Promise<FormSubmission> {
    return this.dataSource.transaction(async (entityManager) => {
      const formSubmissionRepo = entityManager.getRepository(FormSubmission);
      // Acquire a DB lock for the form submission to prevent concurrent completion.
      await formSubmissionRepo.findOne({
        select: { id: true },
        where: { id: submissionId },
        lock: { mode: "pessimistic_write" },
      });
      const formSubmission = await formSubmissionRepo.findOne({
        select: {
          id: true,
          student: { id: true },
          submissionStatus: true,
          formCategory: true,
          formSubmissionItems: {
            id: true,
            updatedAt: true,
            currentDecision: {
              id: true,
              decisionStatus: true,
              decisionNote: { id: true },
            },
          },
        },
        relations: {
          student: true,
          formSubmissionItems: { currentDecision: { decisionNote: true } },
        },
        where: { id: submissionId },
      });
      if (!formSubmission) {
        throw new CustomNamedError(
          `Form submission with ID ${submissionId} not found.`,
          FORM_SUBMISSION_NOT_FOUND,
        );
      }
      this.checkAuthorizationForApproval(
        formSubmission.formCategory,
        userRoles,
      );
      if (formSubmission.submissionStatus !== FormSubmissionStatus.Pending) {
        throw new CustomNamedError(
          "Final decision cannot be made on a form submission with status different than pending.",
          FORM_SUBMISSION_NOT_PENDING,
        );
      }
      // Check if all the items were provided.
      if (items.length !== formSubmission.formSubmissionItems.length) {
        throw new CustomNamedError(
          "The provided form submission items do not match the form submission items for this submission.",
          FORM_SUBMISSION_ITEM_NOT_FOUND,
        );
      }
      // Check for all timestamps and IDs to match to prevent completing the form submission based on outdated information.
      for (const item of items) {
        const submissionItem = formSubmission.formSubmissionItems.find(
          (i) => i.id === item.submissionItemId,
        );
        if (!submissionItem) {
          throw new CustomNamedError(
            `Form submission item with ID ${item.submissionItemId} not found in the form submission.`,
            FORM_SUBMISSION_ITEM_NOT_FOUND,
          );
        }
        if (
          submissionItem.updatedAt.getTime() !== item.lastUpdateDate.getTime()
        ) {
          throw new CustomNamedError(
            `Form submission item with ID ${item.submissionItemId} has been updated since it was last retrieved. Please refresh and try again.`,
            FORM_SUBMISSION_ITEM_OUTDATED,
          );
        }
      }
      let isFullyDeclined = true;
      for (const item of formSubmission.formSubmissionItems) {
        if (
          !item.currentDecision ||
          item.currentDecision.decisionStatus ===
            FormSubmissionDecisionStatus.Pending
        ) {
          throw new CustomNamedError(
            "Final decision cannot be made when some decisions are still pending.",
            FORM_SUBMISSION_DECISION_PENDING,
          );
        }
        if (
          isFullyDeclined &&
          item.currentDecision.decisionStatus ===
            FormSubmissionDecisionStatus.Approved
        ) {
          isFullyDeclined = false;
        }
      }
      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      formSubmission.submissionStatus = isFullyDeclined
        ? FormSubmissionStatus.Declined
        : FormSubmissionStatus.Completed;
      formSubmission.assessedDate = now;
      formSubmission.assessedBy = auditUser;
      formSubmission.modifier = auditUser;
      formSubmission.updatedAt = now;
      // Save form completion.
      const saveFormSubmissionPromise = formSubmissionRepo.save(formSubmission);
      // Associate final notes with the student.
      const noteRelationsPromises = formSubmission.formSubmissionItems.map(
        (item) =>
          this.noteSharedService.createStudentNoteRelation(
            formSubmission.student,
            item.currentDecision.decisionNote,
            entityManager,
          ),
      );
      await Promise.all([saveFormSubmissionPromise, ...noteRelationsPromises]);
      return formSubmission;
    });
  }

  /**
   * Indicates if the form submission item can be updated by the user based on the form category and user roles.
   * @param category The category of the form item being updated, used
   * to determine the required role for authorization.
   * @param userRoles The roles of the user attempting to perform the action.
   * @returns true if the user has the required role for the form category, false otherwise.
   */
  hasApprovalAuthorization(category: FormCategory, userRoles: Role[]): boolean {
    const allowedRole = FORM_SUBMISSION_APPROVAL_ROLES_MAP.get(category);
    return allowedRole ? userRoles.includes(allowedRole) : false;
  }

  /**
   * Ensures the user authorization to update a form submission item
   * based on the form category and user roles.
   * @param category The category of the form item being updated, used
   * to determine the required role for authorization.
   * @param userRoles The roles of the user attempting to perform the action.
   * @throws CustomNamedError with FORM_SUBMISSION_UPDATE_UNAUTHORIZED
   * if the user does not have the required role for the form category.
   */
  private checkAuthorizationForApproval(
    category: FormCategory,
    userRoles: Role[],
  ): void {
    if (!this.hasApprovalAuthorization(category, userRoles)) {
      throw new CustomNamedError(
        "User does not have the required role to perform this action.",
        FORM_SUBMISSION_UPDATE_UNAUTHORIZED,
      );
    }
  }
}
