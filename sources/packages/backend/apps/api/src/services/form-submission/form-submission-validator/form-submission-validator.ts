import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import {
  FormSubmissionValidatorBase,
  PendingConcurrencyValidator,
  ConfigurationContextValidator,
  ApplicationAppealsValidator,
} from ".";

@Injectable()
export class FormSubmissionValidator {
  private readonly validators: FormSubmissionValidatorBase[];
  constructor(
    private readonly configurationContextValidator: ConfigurationContextValidator,
    private readonly pendingConcurrencyValidator: PendingConcurrencyValidator,
    private readonly applicationAppealsValidator: ApplicationAppealsValidator,
  ) {
    this.validators = [
      this.configurationContextValidator,
      this.pendingConcurrencyValidator,
      this.applicationAppealsValidator,
    ];
  }

  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number | undefined,
  ): Promise<void> {
    const validatorPromises = this.validators.map((validator) =>
      validator.validate(formSubmissionConfigs, studentId),
    );
    await Promise.all(validatorPromises);
  }
}
