import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { InjectRepository } from "@nestjs/typeorm";
import { FormSubmission, FormSubmissionStatus } from "@sims/sims-db";
import { Repository, IsNull } from "typeorm";
import { CustomNamedError } from "@sims/utilities";
import { FORM_SUBMISSION_PENDING_DECISION } from "../constants";
import { FormSubmissionValidatorBase } from ".";

/**
 * Executes validations to prevent concurrent pending form submissions for the
 * same context such as the same category for same student or application.
 */
@Injectable()
export class PendingConcurrencyValidator implements FormSubmissionValidatorBase {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  /**
   * Executes the validation to prevent concurrent pending form submissions.
   * @param formSubmissionConfigs form submission configurations.
   * @param studentId student ID associated with the form submission.
   */
  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number,
  ): Promise<void> {
    // All forms in the submission share the same context, so we can use the first one as reference for the validation.
    const [referencedConfig] = formSubmissionConfigs;
    const hasPendingFormSubmission = await this.formSubmissionRepo.exists({
      where: {
        student: { id: studentId },
        application: referencedConfig.applicationId
          ? { id: referencedConfig.applicationId }
          : IsNull(),
        formCategory: referencedConfig.formCategory,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    });
    if (hasPendingFormSubmission) {
      throw new CustomNamedError(
        "There is already a pending form submission for the same context.",
        FORM_SUBMISSION_PENDING_DECISION,
      );
    }
  }
}
