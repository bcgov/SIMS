import { AppConfigService } from "@/services/AppConfigService";
import { AppConfig } from "@/types/contracts/ConfigContract";
import { computed, ref } from "vue";

const FORMS_SUBMISSION_FEATURE_TOGGLE = "FORMS_SUBMISSION";

export function useFeatureToggles() {
  /**
   * Keep the app config for easy access to the feature toggles.
   * Null only while the config is being loaded for the first time,
   * after that it should always be defined.
   */
  const appConfig = ref<AppConfig | null>(null);

  /**
   * Ensures the config is loaded and up to date
   * when the composable is initialized.
   */
  const loadConfig = async () => {
    appConfig.value = await AppConfigService.shared.config();
  };

  // Load config on composable initialization.
  void loadConfig();

  /**
   * Generic function to check if a feature toggle is enabled.
   * @param featureToggle The name of the feature toggle to check.
   * @returns true if the feature toggle is enabled, false otherwise.
   */
  const isFeatureToggleEnabled = (featureToggle: string) => {
    return appConfig.value?.featureToggles.includes(featureToggle) ?? false;
  };

  /**
   * Form submission feature toggle.
   */
  const isFormSubmissionEnabled = computed(() =>
    isFeatureToggleEnabled(FORMS_SUBMISSION_FEATURE_TOGGLE),
  );

  return {
    isFormSubmissionEnabled,
    isFeatureToggleEnabled,
  };
}
