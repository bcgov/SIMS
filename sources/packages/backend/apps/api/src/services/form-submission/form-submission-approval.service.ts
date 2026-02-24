import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  User,
  FormSubmission,
  FormSubmissionStatus,
  FormSubmissionItem,
  FormSubmissionDecisionStatus,
  Note,
  NoteType,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import {
  FORM_SUBMISSION_DECISION_PENDING,
  FORM_SUBMISSION_ITEM_NOT_FOUND,
  FORM_SUBMISSION_ITEM_NOT_PENDING,
  FORM_SUBMISSION_ITEM_OUTDATED,
  FORM_SUBMISSION_NOT_FOUND,
  FORM_SUBMISSION_NOT_PENDING,
} from "./constants";

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
          submittedData: true,
          decisionStatus: true,
          decisionDate: true,
          decisionNote: { id: true, description: true },
          decisionBy: { id: true, firstName: true, lastName: true },
        },
      },
      relations: {
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          decisionNote: true,
          decisionBy: true,
        },
      },
      where: {
        id: formSubmissionId,
        student: { id: options?.studentId },
        formSubmissionItems: { id: options?.itemId },
      },
      order: { formSubmissionItems: { id: "ASC" } },
    });
  }

  async saveFormSubmissionItem(
    submissionItemId: number,
    decisionStatus: FormSubmissionDecisionStatus,
    noteDescription: string,
    lastDecisionDate: Date | undefined,
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
          decisionNote: { id: true },
          decisionBy: { id: true, firstName: true, lastName: true },
          formSubmission: { id: true, submissionStatus: true },
          decisionDate: true,
        },
        relations: {
          decisionNote: true,
          decisionBy: true,
          formSubmission: true,
        },
        where: { id: submissionItemId },
      });
      if (!submissionItem) {
        throw new CustomNamedError(
          `Form submission item with ID ${submissionItemId} not found.`,
          FORM_SUBMISSION_ITEM_NOT_FOUND,
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
      if (
        submissionItem.decisionDate &&
        submissionItem.decisionDate.getTime() !== lastDecisionDate?.getTime()
      ) {
        throw new CustomNamedError(
          "The form submission item has been updated since it was last retrieved. Please refresh and try again.",
          FORM_SUBMISSION_ITEM_OUTDATED,
        );
      }
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      submissionItem.decisionStatus = decisionStatus;
      submissionItem.decisionBy = auditUser;
      submissionItem.decisionDate = now;
      submissionItem.modifier = auditUser;
      submissionItem.updatedAt = now;
      if (submissionItem.decisionNote) {
        const note = submissionItem.decisionNote;
        note.description = noteDescription;
        note.modifier = auditUser;
        note.updatedAt = now;
      } else {
        const note = { description: noteDescription } as Note;
        note.description = noteDescription;
        note.noteType = NoteType.Application;
        note.createdAt = now;
        note.creator = auditUser;
        submissionItem.decisionNote = note;
      }
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
          formSubmissionItems: {
            id: true,
            decisionStatus: true,
          },
        },
        relations: { formSubmissionItems: true },
        where: { id: submissionId },
      });
      if (!formSubmission) {
        throw new CustomNamedError(
          `Form submission with ID ${submissionId} not found.`,
          FORM_SUBMISSION_NOT_FOUND,
        );
      }
      if (formSubmission.submissionStatus !== FormSubmissionStatus.Pending) {
        throw new CustomNamedError(
          `Final decision cannot be made on a form submission with status ${formSubmission.submissionStatus}.`,
          FORM_SUBMISSION_NOT_PENDING,
        );
      }
      let isFullyDeclined = true;
      for (const item of formSubmission.formSubmissionItems) {
        if (item.decisionStatus === FormSubmissionDecisionStatus.Pending) {
          throw new CustomNamedError(
            "Final decision cannot be made when some decisions are still pending.",
            FORM_SUBMISSION_DECISION_PENDING,
          );
        }
        if (
          isFullyDeclined &&
          item.decisionStatus === FormSubmissionDecisionStatus.Approved
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
      // TODO: should the student notes relation be created at this point?
      return repo.save(formSubmission);
    });
  }
}
