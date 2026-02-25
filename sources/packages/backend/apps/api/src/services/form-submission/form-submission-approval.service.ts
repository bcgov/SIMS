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
  FORM_SUBMISSION_ITEM_NOT_PENDING,
  FORM_SUBMISSION_ITEM_OUTDATED,
  FORM_SUBMISSION_NOT_FOUND,
  FORM_SUBMISSION_NOT_PENDING,
  FORM_SUBMISSION_UPDATE_UNAUTHORIZED,
} from "./constants";
import { FORM_SUBMISSION_APPROVAL_ROLES_MAP } from "./form-submission.models";

@Injectable()
export class FormSubmissionApprovalService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async getFormSubmissionsById(
    formSubmissionId: number,
    options?: { studentId?: number; itemId?: number },
  ): Promise<FormSubmission> {
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
        student: { id: options?.studentId },
        formSubmissionItems: { id: options?.itemId },
      },
      order: { formSubmissionItems: { id: "ASC", decisions: { id: "DESC" } } },
    });
  }

  async saveFormSubmissionItem(
    submissionItemId: number,
    decisionStatus: FormSubmissionDecisionStatus,
    noteDescription: string,
    lastUpdateDate: Date,
    userRoles: Role[],
    auditUserId: number,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      const repo = entityManager.getRepository(FormSubmissionItem);
      // Acquire a DB lock for the form submission item to prevent concurrent updates.
      await repo.findOne({
        select: { id: true },
        where: { id: submissionItemId },
        lock: { mode: "pessimistic_write" },
      });
      const submissionItem = await repo.findOne({
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
      this.checkApprovalAuthorization(
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
          `Decisions cannot be made on items belonging to a form submission with status ${submissionItem.formSubmission.submissionStatus}.`,
          FORM_SUBMISSION_ITEM_NOT_PENDING,
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
      note.noteType = NoteType.Application;
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
      await repo.save(submissionItem);
    });
  }

  /**
   * Marks the form submission as completed or declined based on the decisions on individual form items.
   * @param submissionId The ID of the form submission to complete.
   * @param auditUserId The ID of the user performing the action.
   * @returns The updated form submission.
   */
  async completeFormSubmission(
    submissionId: number,
    userRoles: Role[],
    auditUserId: number,
  ): Promise<FormSubmission> {
    return this.dataSource.transaction(async (entityManager) => {
      const repo = entityManager.getRepository(FormSubmission);
      // Acquire a DB lock for the form submission to prevent concurrent completion.
      await repo.findOne({
        select: { id: true },
        where: { id: submissionId },
        lock: { mode: "pessimistic_write" },
      });
      const formSubmission = await repo.findOne({
        select: {
          id: true,
          submissionStatus: true,
          formCategory: true,
          formSubmissionItems: {
            id: true,
            currentDecision: {
              id: true,
              decisionStatus: true,
            },
          },
        },
        relations: { formSubmissionItems: { currentDecision: true } },
        where: { id: submissionId },
      });
      if (!formSubmission) {
        throw new CustomNamedError(
          `Form submission with ID ${submissionId} not found.`,
          FORM_SUBMISSION_NOT_FOUND,
        );
      }
      this.checkApprovalAuthorization(formSubmission.formCategory, userRoles);
      if (formSubmission.submissionStatus !== FormSubmissionStatus.Pending) {
        throw new CustomNamedError(
          `Final decision cannot be made on a form submission with status ${formSubmission.submissionStatus}.`,
          FORM_SUBMISSION_NOT_PENDING,
        );
      }
      let isFullyDeclined = true;
      for (const item of formSubmission.formSubmissionItems) {
        if (
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
      // TODO: Create a student note to allow the final note to be displayed in the student notes tab.
      return repo.save(formSubmission);
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
   * @throws CustomNamedError with FORM_SUBMISSION_ITEM_DECISION_UNAUTHORIZED
   * if the user does not have the required role for the form category.
   */
  private checkApprovalAuthorization(
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
