import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { CustomNamedError } from "@sims/utilities";
import { FormSubmissionValidatorBase } from ".";
import { FormSubmissionService } from "../..";
import { FORM_SUBMISSION_BLOCKED } from "../constants";

/**
 * Executes validations to prevent form submissions which are currently blocked.
 */
@Injectable()
export class SubmissionBlockedValidator implements FormSubmissionValidatorBase {
  constructor(private readonly formSubmissionService: FormSubmissionService) {}

  /**
   * Executes the validation to prevent blocked form submissions.
   * @param formSubmissionConfigs form submission configurations.
   * @param studentId student ID associated with the form submission.
   */
  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number,
  ): Promise<void> {
    const blockedReasons = await this.formSubmissionService.checkIfFormsBlocked(
      formSubmissionConfigs.map((config) => config.formDefinitionName),
      studentId,
    );
    // A single blocked form will fail the entire submission.
    if (blockedReasons.size > 0) {
      throw new CustomNamedError(
        "The form is currently blocked from submission.",
        FORM_SUBMISSION_BLOCKED,
      );
    }
  }
}
