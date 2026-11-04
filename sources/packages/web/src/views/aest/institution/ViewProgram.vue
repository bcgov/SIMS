<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="View Program"
      />
    </template>
    <template #alerts>
      <institution-restriction-banner
        v-if="!!locationId"
        :scope="InstitutionRestrictionDisplayScope.Program"
        :location-id="locationId"
        :program-id="programId"
        :institution-id="institutionId"
      />
    </template>
    <program-form
      :title="formTitle"
      :program-configuration="educationProgram"
      :is-loading="loading"
      :is-read-only="true"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSnackBar } from "@/composables";
import type { BackTarget } from "@/types";
import { InstitutionRestrictionDisplayScope } from "@/types";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import { EducationProgramService } from "@/services/EducationProgramService";

interface ViewProgramProps {
  locationId?: number;
  programId: number;
  institutionId?: number;
  backTarget: BackTarget;
}
const props = defineProps<ViewProgramProps>();
const snackBar = useSnackBar();
const loading = ref(true);
const educationProgram = ref<EducationProgramAPIOutDTO>();
const formTitle = computed(() =>
  educationProgram.value
    ? `${educationProgram.value.programYearName} Program`
    : undefined,
);

watch(
  () => props.programId,
  async (programId) => {
    try {
      loading.value = true;
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(programId);
    } catch {
      snackBar.error("Unexpected error while loading program data.");
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>
