import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";

@Injectable()
export abstract class FormSubmissionValidatorBase {
  abstract validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number | undefined,
  ): Promise<void> | void;
}
