import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { CustomNamedError } from "@sims/utilities";
import { FormSubmissionValidatorBase } from ".";
import { FormSubmissionService, StudentService } from "../..";
import { FORM_SUBMISSION_BLOCKED } from "../constants";

/**
 * Executes validations to prevent form submissions which are currently blocked.
 */
@Injectable()
export class SubmissionBlockedValidator implements FormSubmissionValidatorBase {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly studentService: StudentService,
  ) {}

  /**
   * Executes the validation to prevent blocked form submissions.
   * @param formSubmissionConfigs form submission configurations.
   * @param studentId student ID associated with the form submission.
   */
  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number,
  ): Promise<void> {
    // All forms in the submission share the same context, so we can use the first one as reference for the validation.
    const [referencedConfig] = formSubmissionConfigs;
    const student = await this.studentService.getStudentById(studentId);
    const blockedReason = this.formSubmissionService.checkIfFormBlocked(
      referencedConfig.formDefinitionName,
      student,
    );
    if (blockedReason) {
      throw new CustomNamedError(
        "The form is currently blocked from submission.",
        FORM_SUBMISSION_BLOCKED,
      );
    }
  }
}
