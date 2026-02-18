import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import {
  FormSubmissionValidatorBase,
  PendingConcurrencyValidator,
  ConfigurationContextValidator,
  ApplicationEligibleAppealsValidator,
} from ".";

/**
 * Groups all validators related to form submission and executes them in a single flow.
 * New validators can be added to the flow by implementing the {@see FormSubmissionValidatorBase} interface
 * and adding them to the validators array in the constructor.
 */
@Injectable()
export class FormSubmissionValidator {
  private readonly validators: FormSubmissionValidatorBase[];
  constructor(
    private readonly configurationContextValidator: ConfigurationContextValidator,
    private readonly pendingConcurrencyValidator: PendingConcurrencyValidator,
    private readonly applicationEligibleAppealsValidator: ApplicationEligibleAppealsValidator,
  ) {
    this.validators = [
      this.configurationContextValidator,
      this.pendingConcurrencyValidator,
      this.applicationEligibleAppealsValidator,
    ];
  }

  /**
   * Executes all form submission validations.
   * Each validator is responsible to determined if the context requires its validation or not.
   * The process will be executed in parallel and will stop and throw an error if any of the validators fail,
   * otherwise, it will complete successfully if all validators pass.
   * @param formSubmissionConfigs form submission configurations.
   * @param studentId student ID associated with the form submission.
   */
  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number | undefined,
  ): Promise<void> {
    const validatorPromises = this.validators.map((validator) =>
      // Ensure that both synchronous and asynchronous validators are handled uniformly as promises.
      Promise.resolve(validator.validate(formSubmissionConfigs, studentId)),
    );
    await Promise.all(validatorPromises);
  }
}
