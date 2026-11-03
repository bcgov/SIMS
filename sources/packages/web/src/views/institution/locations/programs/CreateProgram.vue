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
      :loading="loading"
      :read-only="false"
      :is-processing="processing"
      @submit="submit"
      @cancel="goBack"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { useSnackBar } from "@/composables";
import { computed, onMounted, ref } from "vue";
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
const processing = ref(false);
const loading = ref(true);
const programConfiguration = ref<EducationProgramConfigurationAPIOutDTO>();
const formTitle = computed(() =>
  programConfiguration.value
    ? `Program Creation for ${programConfiguration.value.programYearName}`
    : undefined,
);

onMounted(async () => {
  try {
    let programYearId = props.programYearId;
    if (!programYearId) {
      const currentProgramYears =
        await EducationProgramService.shared.getProgramYearsList();
      const activeProgramYear = currentProgramYears.find(
        (year) => year.hasActiveProgramConfiguration,
      );
      if (!activeProgramYear) {
        snackBar.error(
          "Programs cannot be created at this time because there is no program year currently open.",
        );
        return;
      }
      programYearId = activeProgramYear.id;
    }
    programConfiguration.value =
      await EducationProgramService.shared.getEducationProgramConfiguration(
        programYearId,
      );
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
});

const submit = async (programData: Record<string, unknown>) => {
  if (!programConfiguration.value) {
    snackBar.error("Unable to create program: missing program configuration.");
    return;
  }
  processing.value = true;
  try {
    await EducationProgramService.shared.createEducationProgram({
      programData,
      programConfigurationId: programConfiguration.value.configurationId,
    });
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

const goBack = async (): Promise<void> => {
  router.push(props.backTarget.to);
};
</script>
