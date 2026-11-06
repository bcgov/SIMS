<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="Create Program"
      />
    </template>
    <program-form
      :title="formTitle"
      :program-configuration="programConfiguration"
      :is-loading="loading"
      :is-read-only="false"
      :is-processing="processing"
      @submit="submit"
      @cancel="goBack"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { useFeatureToggles, useSnackBar } from "@/composables";
import { computed, ref, watch } from "vue";
import type { BackTarget } from "@/types";
import { ApiProcessError } from "@/types";
import { useRouter } from "vue-router";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import { EducationProgramConfigurationAPIOutDTO } from "@/services/http/dto";
import { EducationProgramService } from "@/services/EducationProgramService";

interface CreateProgramProps {
  programYearId?: number;
  backTarget: BackTarget;
}

const snackBar = useSnackBar();
const props = defineProps<CreateProgramProps>();
const router = useRouter();
const { isManageProgramsEnabled } = useFeatureToggles();
const processing = ref(false);
const loading = ref(true);
const programConfiguration = ref<EducationProgramConfigurationAPIOutDTO>();
// Program year used to load the program configuration, either the one
// provided or the active program year used as a fallback.
const resolvedProgramYearId = ref<number>();
const formTitle = computed(() => {
  if (!isManageProgramsEnabled.value) {
    return "Program";
  }
  return programConfiguration.value
    ? `Program Creation for ${programConfiguration.value.programYearName}`
    : undefined;
});

const submit = async (programData: Record<string, unknown>) => {
  if (!programConfiguration.value || !resolvedProgramYearId.value) {
    snackBar.error("Unable to create program: missing program configuration.");
    return;
  }
  processing.value = true;
  try {
    await EducationProgramService.shared.createEducationProgram(
      resolvedProgramYearId.value,
      {
        programData,
        programConfigurationId: programConfiguration.value.configurationId,
      },
    );
    snackBar.success("Education Program created successfully!");
    await goBack();
  } catch (error: unknown) {
    if (error instanceof ApiProcessError) {
      snackBar.error(error.message);
    } else {
      snackBar.error("An error happened during the saving process.");
    }
  } finally {
    processing.value = false;
  }
};

const goBack = (): void => {
  router.push(props.backTarget.to);
};

/**
 * Loads the program configuration for the given program year,
 * falling back to the currently active program year when none is provided.
 * @param programYearId program year to load the configuration for.
 */
const loadProgramConfiguration = async (
  programYearId?: number,
): Promise<void> => {
  loading.value = true;
  programConfiguration.value = undefined;
  resolvedProgramYearId.value = undefined;
  try {
    if (!programYearId) {
      // Temporarily fall back to the active program year if none is provided to
      // allow the current program creation path to continue to work.
      const currentProgramYears =
        await EducationProgramService.shared.getProgramYearsList();
      const activeProgramYear = currentProgramYears.find(
        (year) => year.hasActiveProgramConfiguration,
      );
      if (!activeProgramYear) {
        snackBar.error(
          "Programs cannot be created at this time because no program year is currently active.",
        );
        return;
      }
      programYearId = activeProgramYear.id;
    }
    programConfiguration.value =
      await EducationProgramService.shared.getEducationProgramForCreate(
        programYearId,
      );
    resolvedProgramYearId.value = programYearId;
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};

watch(() => props.programYearId, loadProgramConfiguration, {
  immediate: true,
});
</script>
