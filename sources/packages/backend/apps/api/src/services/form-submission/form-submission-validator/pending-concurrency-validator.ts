import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { InjectRepository } from "@nestjs/typeorm";
import { FormSubmission, FormSubmissionStatus } from "@sims/sims-db";
import { Repository, IsNull } from "typeorm";
import { CustomNamedError } from "@sims/utilities";
import { FORM_SUBMISSION_PENDING_DECISION } from "../constants";
import { FormSubmissionValidatorBase } from ".";

@Injectable()
export class PendingConcurrencyValidator implements FormSubmissionValidatorBase {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number,
  ): Promise<void> {
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
