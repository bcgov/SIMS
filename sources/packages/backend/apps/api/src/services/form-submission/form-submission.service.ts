import { Injectable } from "@nestjs/common";
import { In, Repository } from "typeorm";
import {
  FormCategory,
  FormSubmission,
  FormSubmissionStatus,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class FormSubmissionService {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  /**
   * Gets all non-completed form submissions for a given application.
   * Pending or fully declined form submissions are considered non-completed, and are
   * usually displayed separated from the completed ones that potentially generated
   * assessment.
   * @param applicationId
   * @param studentId
   * @returns
   */
  async getNonCompletedStudentAppeals(
    applicationId: number,
    studentId?: number,
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
      },
      where: {
        application: { id: applicationId },
        student: { id: studentId },
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: In([
          FormSubmissionStatus.Pending,
          FormSubmissionStatus.Declined,
        ]),
      },
    });
  }

  /**
   * Gets a form submission by its ID.
   * @param formSubmissionId The ID of the form submission to retrieve.
   * @param studentId student ID for authorization.
   * @returns The form submission if found, otherwise null.
   */
  async getFormSubmissionById(
    formSubmissionId: number,
    studentId: number,
  ): Promise<FormSubmission | null> {
    return this.formSubmissionRepo.findOne({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
        formCategory: true,
        application: {
          id: true,
          applicationNumber: true,
        },
        formSubmissionItems: {
          id: true,
          dynamicFormConfiguration: {
            id: true,
            formType: true,
            formCategory: true,
            formDefinitionName: true,
          },
          submittedData: true,
          updatedAt: true,
          currentDecision: {
            id: true,
            decisionStatus: true,
            decisionNote: {
              id: true,
              description: true,
            },
          },
        },
      },
      relations: {
        application: true,
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          currentDecision: { decisionNote: true },
        },
      },
      where: {
        id: formSubmissionId,
        student: { id: studentId },
      },
      order: { formSubmissionItems: { id: "ASC" } },
    });
  }
}
