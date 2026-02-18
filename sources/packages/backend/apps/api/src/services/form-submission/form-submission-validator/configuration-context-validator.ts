import { Injectable } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { CustomNamedError } from "@sims/utilities";
import {
  FORM_SUBMISSION_APPLICATION_SCOPE_MISSING_APPLICATION_ID,
  FORM_SUBMISSION_BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED,
  FORM_SUBMISSION_MIXED_FORM_APPLICATION_SCOPE,
  FORM_SUBMISSION_MIXED_FORM_CATEGORIES,
} from "../constants";
import { FormSubmissionValidatorBase } from ".";

/**
 * Executes validations related to the context of the form submission, such as the
 * form category, application scope, and bundled submission rules.
 * For example, it validates that all forms in the submission share the same application scope
 * and form category, and that they have an application ID when they have application scope.
 */
@Injectable()
export class ConfigurationContextValidator implements FormSubmissionValidatorBase {
  /**
   * Executes the validation of form submission context rules.
   * @param formSubmissionConfigs form submission configurations.
   */
  validate(formSubmissionConfigs: FormSubmissionConfig[]): void {
    // All forms in the submission share the same context, so we can use the first one as reference for the validation.
    const [referencedConfig] = formSubmissionConfigs;
    // Validate if all forms share the same scope.
    const hasSameApplicationScope = formSubmissionConfigs.every(
      (config) =>
        config.hasApplicationScope === referencedConfig.hasApplicationScope,
    );
    if (!hasSameApplicationScope) {
      throw new CustomNamedError(
        "All forms in the submission must have the same application scope.",
        FORM_SUBMISSION_MIXED_FORM_APPLICATION_SCOPE,
      );
    }
    // For application scoped forms, validate if all forms have an application ID.
    if (referencedConfig.hasApplicationScope) {
      const hasApplicationId = formSubmissionConfigs.every(
        (config) => !!config.applicationId,
      );
      if (!hasApplicationId) {
        throw new CustomNamedError(
          "All forms in the submission must have an application ID when they have application scope.",
          FORM_SUBMISSION_APPLICATION_SCOPE_MISSING_APPLICATION_ID,
        );
      }
    }
    // Validate if the forms allow bundled submissions when there are multiple items.
    const hasAllowedItemsQuantity =
      formSubmissionConfigs.length === 1 ||
      (formSubmissionConfigs.length > 1 &&
        formSubmissionConfigs.every((item) => item.allowBundledSubmission));
    if (!hasAllowedItemsQuantity) {
      throw new CustomNamedError(
        "One or more forms in the submission do not allow bundled submissions.",
        FORM_SUBMISSION_BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED,
      );
    }
    // Validate if all forms share the same category.
    const allSameCategory = formSubmissionConfigs.every(
      (config) => config.formCategory === referencedConfig.formCategory,
    );
    if (!allSameCategory) {
      throw new CustomNamedError(
        "All forms in the submission must share the same form category.",
        FORM_SUBMISSION_MIXED_FORM_CATEGORIES,
      );
    }
  }
}
