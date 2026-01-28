import { Injectable } from "@nestjs/common";
import { DataSource, IsNull, Repository } from "typeorm";
import {
  Application,
  User,
  FileOriginType,
  Student,
  FormSubmission,
  FormCategory,
  FormSubmissionGrouping,
  FormSubmissionStatus,
  FormSubmissionItem,
  DynamicFormConfiguration,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import { InjectRepository } from "@nestjs/typeorm";
import { FormSubmissionModel } from "apps/api/src/services/form-submission/form-submission.models";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class FormSubmissionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentFileService: StudentFileService,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async saveFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    formCategory: FormCategory,
    submissionGrouping: FormSubmissionGrouping,
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
      formSubmission.submissionGrouping = submissionGrouping;
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
    submissionGrouping: FormSubmissionGrouping,
  ): Promise<boolean> {
    return this.formSubmissionRepo.exists({
      where: {
        student: { id: studentId },
        application: applicationId ? { id: applicationId } : IsNull(),
        formCategory: formCategory,
        submissionGrouping: submissionGrouping,
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
        },
        application: { id: true, applicationNumber: true },
      },
      relations: {
        formSubmissionItems: { dynamicFormConfiguration: true },
        application: true,
      },
      where: [{ student: { id: studentId } }],
      order: { submittedDate: "DESC", formSubmissionItems: { id: "ASC" } },
    });
  }
}
