import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";

/**
 * Base interface for form submission validators.
 * Each validator should implement the validate method, which will be executed during the form submission process.
 * The validate method can be asynchronous or synchronous, and it should throw an error if the validation fails.
 * Each validator is responsible for determining if the context of the form submission requires its validation or not.
 */
@Injectable()
export abstract class FormSubmissionValidatorBase {
  /**
   * Executes the validation of form submission based on the provided configurations and an optional student ID.
   * If some validation fails, an error should be thrown with a clear message indicating the reason for the failure.
   * @param formSubmissionConfigs form submission configurations.
   * @param studentId non-mandatory student ID associated with the form submission.
   */
  abstract validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number | undefined,
  ): Promise<void> | void;
}
