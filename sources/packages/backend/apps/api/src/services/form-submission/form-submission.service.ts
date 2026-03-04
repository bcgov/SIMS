import { Injectable } from "@nestjs/common";
import { In, Repository } from "typeorm";
import { FormSubmission, FormSubmissionStatus } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class FormSubmissionService {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async getNonCompletedFormSubmissions(
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
        student: studentId ? { id: studentId } : undefined,
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
   * @param options optional filters.
   * - `itemId`: if provided, returns only the form submission item with the specified ID in the
   * form submission items array.
   * @returns The form submission if found, otherwise null.
   */
  async getFormSubmissionsById(
    formSubmissionId: number,
    options?: { studentId?: number },
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
          },
        },
      },
      relations: {
        application: true,
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          currentDecision: true,
        },
      },
      where: {
        id: formSubmissionId,
        student: { id: options.studentId },
      },
      order: { formSubmissionItems: { id: "ASC" } },
    });
  }
}
