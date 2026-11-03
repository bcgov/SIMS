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
      :program-id="programId"
      :is-renewal="true"
      :read-only="false"
      :is-processing="processing"
      @create="submit"
      @cancel="goBack"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { useSnackBar } from "@/composables";
import { ref } from "vue";
import type { BackTarget } from "@/types";
import { ApiProcessError } from "@/types";
import { useRouter } from "vue-router";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import { CreateEducationProgramAPIInDTO } from "@/services/http/dto";
import { EducationProgramService } from "@/services/EducationProgramService";

interface CreateProgramProps {
  programId: number;
  configurationId: number;
  backTarget: BackTarget;
}

const snackBar = useSnackBar();
const props = defineProps<CreateProgramProps>();
const router = useRouter();
const processing = ref(false);

const submit = async (program: CreateEducationProgramAPIInDTO) => {
  processing.value = true;
  try {
    await EducationProgramService.shared.renewEducationProgram(
      props.programId,
      program,
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

const goBack = async (): Promise<void> => {
  router.push(props.backTarget.to);
};
</script>
