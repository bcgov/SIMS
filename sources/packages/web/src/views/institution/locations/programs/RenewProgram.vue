<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="Renew Program"
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
import { useSnackBar } from "@/composables";
import { computed, ref, watch } from "vue";
import type { BackTarget } from "@/types";
import { ApiProcessError } from "@/types";
import { useRouter } from "vue-router";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import { EducationProgramConfigurationAPIOutDTO } from "@/services/http/dto";
import { EducationProgramService } from "@/services/EducationProgramService";

interface CreateProgramProps {
  programId: number;
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
    ? `Program Renewal for ${programConfiguration.value.programYearName}`
    : undefined,
);

const submit = async (programData: Record<string, unknown>) => {
  if (!programConfiguration.value) {
    snackBar.error("Unable to create program: missing program configuration.");
    return;
  }
  processing.value = true;
  try {
    await EducationProgramService.shared.renewEducationProgram(
      props.programId,
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
      snackBar.error("An error happened during the renewal process.");
    }
  } finally {
    processing.value = false;
  }
};

const goBack = (): void => {
  router.push(props.backTarget.to);
};

watch(
  () => props.programId,
  async (programId) => {
    try {
      loading.value = true;
      programConfiguration.value =
        await EducationProgramService.shared.getEducationProgramForRenew(
          programId,
        );
    } catch {
      snackBar.error("Unexpected error while loading program data.");
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>
