import { Injectable } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";

const FORMS_SUBMISSION = "FORMS_SUBMISSION";
const TOGGLE_PREFIX_DISABLE = "disable";
const NOTIFY_TEMPLATE_PREFIX = "notify-template";
const NOTIFY_TEMPLATE_ALL = `${NOTIFY_TEMPLATE_PREFIX}-all`;

@Injectable()
export class FeatureTogglesService {
  readonly isFormSubmissionEnabled: boolean = false;
  readonly featureToggles: string[] | undefined;

  constructor(private readonly configService: ConfigService) {
    this.featureToggles = this.configService.featureToggles;
    this.isFormSubmissionEnabled =
      this.isFeatureToggleEnabled(FORMS_SUBMISSION);
  }

  /**
   * Checks if a specific feature toggle is enabled.
   * @param featureToggle The name of the feature toggle to check.
   * @returns true if the feature toggle is enabled, false otherwise.
   */
  private isFeatureToggleEnabled(featureToggle: string): boolean {
    return this.featureToggles?.includes(featureToggle) ?? false;
  }

  /**
   * Check if a form is disabled based on the feature toggles configuration.
   * If a form is included in the feature toggle list, it is considered as disabled.
   * To disable a form, the feature toggle should be in the format of `disable-{formDefinitionName}`.
   * @param formDefinitionName form definition name to validate the toggle.
   * @returns true if the form is disabled, false otherwise.
   */
  isFormDisabled(formDefinitionName: string): boolean {
    return !!this.featureToggles?.includes(
      `${TOGGLE_PREFIX_DISABLE}-${formDefinitionName}`,
    );
  }

  /**
   * Determine when the BC Notify template should be used, instead legacy GC Notify template.
   * @param templateId ID of the template to check.
   * @returns true if the template should be used, false otherwise.
   */
  useNotifyTemplate(templateId: string): boolean {
    return (
      this.isFeatureToggleEnabled(NOTIFY_TEMPLATE_ALL) ||
      this.isFeatureToggleEnabled(`${NOTIFY_TEMPLATE_PREFIX}-${templateId}`)
    );
  }
}
