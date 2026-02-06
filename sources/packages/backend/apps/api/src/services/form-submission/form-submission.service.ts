import { Injectable } from "@nestjs/common";
import { DataSource, IsNull, Not, Repository } from "typeorm";
import {
  Application,
  User,
  FileOriginType,
  Student,
  FormSubmission,
  FormCategory,
  FormSubmissionStatus,
  FormSubmissionItem,
  DynamicFormConfiguration,
  Note,
  NoteType,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FormSubmissionConfig,
  FormSubmissionModel,
} from "./form-submission.models";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";
import { DynamicFormConfigurationService } from "../../services";
import { CustomNamedError } from "@sims/utilities";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class FormSubmissionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentFileService: StudentFileService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
    @InjectRepository(FormSubmissionItem)
    private readonly formSubmissionItemRepo: Repository<FormSubmissionItem>,
  ) {}

  async saveFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    formCategory: FormCategory,
    submissionItems: FormSubmissionModel[],
    auditUserId: number,
  ): Promise<FormSubmission> {
    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      const creator = { id: auditUserId } as User;
      const formSubmission = new FormSubmission();
      formSubmission.student = { id: studentId } as Student;
      formSubmission.application = { id: applicationId } as Application;
      formSubmission.submittedDate = now;
      formSubmission.submissionStatus = FormSubmissionStatus.Pending;
      formSubmission.formCategory = formCategory;
      formSubmission.creator = creator;
      formSubmission.createdAt = now;
      formSubmission.formSubmissionItems = submissionItems.map(
        (submissionItem) =>
          ({
            dynamicFormConfiguration: {
              id: submissionItem.dynamicConfigurationId,
            } as DynamicFormConfiguration,
            submittedData: submissionItem.formData,
            decisionStatus: FormSubmissionDecisionStatus.Pending,
            creator: creator,
            createdAt: now,
          }) as FormSubmissionItem,
      );
      const uniqueFileNames: string[] = submissionItems.flatMap(
        (submissionItem) => submissionItem.files,
      );
      if (uniqueFileNames.length) {
        await this.studentFileService.updateStudentFiles(
          studentId,
          auditUserId,
          uniqueFileNames,
          // TODO: change to appeal?
          FileOriginType.Student,
          { entityManager: entityManager },
        );
      }
      // TODO: send notification.
      return entityManager.getRepository(FormSubmission).save(formSubmission);
    });
  }

  /**
   * Checks if there is pending form submission for the submission context.
   * @param studentId student ID related to the appeal.
   * @param formCategory form category that, together with submission grouping,
   * identifies the type of form submission.
   * @param submissionGrouping submission grouping that, together with form category,
   * identifies the type of form submission.
   * @param options query options.
   * - `applicationId` application ID to filter the submission, when applicable.
   * @returns true if exists, false otherwise.
   */
  async hasPendingFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    formCategory: FormCategory,
  ): Promise<boolean> {
    return this.formSubmissionRepo.exists({
      where: {
        student: { id: studentId },
        application: applicationId ? { id: applicationId } : IsNull(),
        formCategory: formCategory,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    });
  }

  async getFormSubmissionsByStudentId(
    studentId: number,
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        formCategory: true,
        submissionStatus: true,
        submittedDate: true,
        assessedDate: true,
        formSubmissionItems: {
          id: true,
          dynamicFormConfiguration: {
            id: true,
            formType: true,
          },
          decisionStatus: true,
          decisionDate: true,
        },
        application: { id: true, applicationNumber: true },
      },
      relations: {
        formSubmissionItems: { dynamicFormConfiguration: true },
        application: true,
      },
      where: { student: { id: studentId } },
      order: { submittedDate: "DESC", formSubmissionItems: { id: "ASC" } },
    });
  }

  async getFormSubmissionsById(
    formSubmissionId: number,
    options?: { studentId?: number },
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
        },
      },
      relations: {
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          decisionNote: true,
        },
      },
      where: { id: formSubmissionId, student: { id: options?.studentId } },
    });
  }

  convertToFormSubmissionConfigs(
    submissionItems: FormSubmissionModel[],
  ): FormSubmissionConfig[] {
    return submissionItems.map((submissionItem) => {
      const config = this.dynamicFormConfigurationService.getDynamicFormById(
        submissionItem.dynamicConfigurationId,
      );
      if (!config) {
        throw new CustomNamedError(
          "One or more forms in the submission are not recognized.",
          "UNKNOWN_FORM_CONFIGURATION",
        );
      }
      return {
        ...submissionItem,
        ...config,
      };
    });
  }

  validatedFormConfiguration(
    submissionItems: FormSubmissionConfig[],
    applicationId: number | undefined,
  ): void {
    const validationModels =
      this.convertToFormSubmissionConfigs(submissionItems);
    // Validate if all forms share the same scope.
    if (applicationId) {
      const hasApplicationScope = validationModels.every(
        (validationModel) => validationModel.hasApplicationScope,
      );
      if (!hasApplicationScope) {
        throw new CustomNamedError(
          "All forms in the submission must have application scope if an application ID is provided.",
          "MIXED_FORM_APPLICATION_SCOPE",
        );
      }
    }
    // Validate if the forms allow bundled submissions when there are multiple items.
    const hasAllowedItemsQuantity =
      validationModels.length === 1 ||
      (validationModels.length > 1 &&
        validationModels.every((item) => item.allowBundledSubmission));
    if (!hasAllowedItemsQuantity) {
      throw new CustomNamedError(
        "One or more forms in the submission do not allow bundled submissions.",
        "BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED",
      );
    }
    // Validate if all forms share the same category.
    const [referenceForm] = validationModels;
    const allSameCategory = validationModels.every(
      (validationModel) =>
        validationModel.formCategory === referenceForm.formCategory,
    );
    if (!allSameCategory) {
      throw new CustomNamedError(
        "All forms in the submission must share the same form category.",
        "MIXED_FORM_CATEGORIES",
      );
    }
  }

  /**
   * Get student appeals submissions that are not in pending status.
   * The non-pending submissions should be either pending for decision
   * or had all their individual items declined.
   * @param applicationId application ID to filter the submissions.
   * @returns list of non-completed student appeals submissions.
   */
  async getNonCompletedAppealsSubmissions(
    applicationId: number,
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
      },
      where: {
        formCategory: FormCategory.StudentAppeal,
        application: { id: applicationId },
        submissionStatus: Not(FormSubmissionStatus.Pending),
      },
    });
  }

  async saveFormSubmissionItem(
    submissionItemId: number,
    decisionStatus: FormSubmissionDecisionStatus,
    noteDescription: string,
    auditUserId: number,
  ): Promise<FormSubmissionItem> {
    const submissionItem = await this.formSubmissionItemRepo.findOne({
      select: {
        id: true,
        decisionNote: { id: true },
        formSubmission: { id: true, submissionStatus: true },
      },
      relations: { decisionNote: true, formSubmission: true },
      where: { id: submissionItemId },
    });
    if (!submissionItem) {
      throw new CustomNamedError(
        `Form submission item with ID ${submissionItemId} not found.`,
        "FORM_SUBMISSION_ITEM_NOT_FOUND",
      );
    }
    if (
      submissionItem.formSubmission.submissionStatus !==
      FormSubmissionStatus.Pending
    ) {
      throw new CustomNamedError(
        `Decisions cannot be made on items belonging to a form submission with status ${submissionItem.formSubmission.submissionStatus}.`,
        "FORM_SUBMISSION_NOT_PENDING",
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
    return this.formSubmissionItemRepo.save(submissionItem);
  }

  async completeFormSubmission(
    submissionId: number,
    auditUserId: number,
  ): Promise<FormSubmission> {
    const formSubmission = await this.formSubmissionRepo.findOne({
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
        "FORM_SUBMISSION_NOT_FOUND",
      );
    }
    if (formSubmission.submissionStatus !== FormSubmissionStatus.Pending) {
      throw new CustomNamedError(
        `Final decision cannot be made on a form submission with status ${formSubmission.submissionStatus}.`,
        "FORM_SUBMISSION_NOT_PENDING",
      );
    }
    let isFullyDeclined = true;
    for (const item of formSubmission.formSubmissionItems) {
      if (item.decisionStatus === FormSubmissionDecisionStatus.Pending) {
        throw new CustomNamedError(
          "Final decision cannot be made when some decisions are still pending.",
          "FORM_SUBMISSION_DECISION_PENDING",
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
    return this.formSubmissionRepo.save(formSubmission);
  }
}
