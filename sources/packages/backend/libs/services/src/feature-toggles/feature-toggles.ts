import { Injectable } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";

const FORMS_SUBMISSION = "FORMS_SUBMISSION";

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
}
