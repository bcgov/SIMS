import { Injectable } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";

const FORMS_SUBMISSION = "FORMS_SUBMISSION";
const TOGGLE_PREFIX_DISABLE = "disable";

@Injectable()
export class FeatureTogglesService {
  readonly isFormSubmissionEnabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.isFormSubmissionEnabled =
      this.isFeatureToggleEnabled(FORMS_SUBMISSION);
  }

  /**
   * Checks if a specific feature toggle is enabled.
   * @param featureToggle The name of the feature toggle to check.
   * @returns true if the feature toggle is enabled, false otherwise.
   */
  private isFeatureToggleEnabled(featureToggle: string): boolean {
    return this.configService.featureToggles?.includes(featureToggle) ?? false;
  }

  /**
   * Check if a form is disabled based on the feature toggles configuration.
   * If a form is included in the feature toggle list, it is considered as disabled.
   * To disable a form, the feature toggle should be in the format of `disable-{formDefinitionName}`.
   * @param formDefinitionName form definition name to validate the toggle.
   * @returns true if the form is disabled, false otherwise.
   */
  isFormDisabled(formDefinitionName: string): boolean {
    return !!this.configService.featureToggles?.includes(
      `${TOGGLE_PREFIX_DISABLE}-${formDefinitionName}`,
    );
  }
}
