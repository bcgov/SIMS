import { computed, ref } from "vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import type { EducationProgramYearAPIOutDTO } from "@/services/http/dto";
import { useSnackBar } from "./useSnackBar";

/**
 * Program years with education program configurations, shared across all
 * composable instances. Undefined until loaded for the first time.
 */
const educationProgramYearsCache = ref<EducationProgramYearAPIOutDTO[]>();
/**
 * Indicates the program years are being loaded, shared across all
 * composable instances.
 */
const educationProgramYearsLoading = ref(false);

export function useEducationProgramYears() {
  const snackBar = useSnackBar();

  /**
   * Program years from the shared cache, or an empty list when not loaded yet.
   */
  const educationProgramYears = computed(
    () => educationProgramYearsCache.value ?? [],
  );

  /**
   * Indicates the program years are being loaded.
   */
  const loadingEducationProgramYears = computed(
    () => educationProgramYearsLoading.value,
  );

  /**
   * Loads the program years from the API into the shared cache,
   * refreshing them even when they were already loaded.
   * In case of failure, a warning is displayed and the cache is kept as is.
   */
  const loadEducationProgramYears = async (): Promise<void> => {
    educationProgramYearsLoading.value = true;
    try {
      educationProgramYearsCache.value =
        await EducationProgramService.shared.getProgramYearsList();
    } catch {
      snackBar.warn("Unexpected error while loading education program years.");
    } finally {
      educationProgramYearsLoading.value = false;
    }
  };

  return {
    educationProgramYears,
    loadingEducationProgramYears,
    loadEducationProgramYears,
  };
}
