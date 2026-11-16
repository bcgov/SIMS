import { AppConfigService } from "@/services/AppConfigService";
import { AppConfig } from "@/types/contracts/ConfigContract";
import { computed, ref } from "vue";

const FORMS_SUBMISSION_FEATURE_TOGGLE = "FORMS_SUBMISSION";
const BULK_WITHDRAWAL_UPLOAD_FEATURE_TOGGLE = "BULK_WITHDRAWAL_UPLOAD";
export const MANAGE_PROGRAMS_FEATURE_TOGGLE = "MANAGE_PROGRAMS";

/**
 * App config shared across all composable instances.
 * Null only while the config is being loaded for the first time,
 * after that it should always be defined.
 */
const appConfig = ref<AppConfig | null>(null);

/**
 * Loads the config into the shared ref. The service caches the config,
 * so this is cheap, and it still refreshes once the cache expires.
 */
const loadConfig = async () => {
  appConfig.value = await AppConfigService.shared.config();
};

export function useFeatureToggles() {
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

  /**
   * Bulk withdrawal upload feature toggle.
   */
  const isBulkWithdrawalUploadEnabled = computed(() =>
    isFeatureToggleEnabled(BULK_WITHDRAWAL_UPLOAD_FEATURE_TOGGLE),
  );

  /**
   * Manage programs feature toggle.
   */
  const isManageProgramsEnabled = computed(() =>
    isFeatureToggleEnabled(MANAGE_PROGRAMS_FEATURE_TOGGLE),
  );

  return {
    loadConfig,
    isFormSubmissionEnabled,
    isBulkWithdrawalUploadEnabled,
    isManageProgramsEnabled,
    isFeatureToggleEnabled,
  };
}
