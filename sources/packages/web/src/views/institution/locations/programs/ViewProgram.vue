<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="View Program"
      >
        <template #buttons v-if="allowProgramChanges">
          <program-actions-menu
            :program-id="programId"
            navigation-title="Edit"
            :navigation-route="editProgramRoute"
            :navigation-disabled="!canModifyProgram"
            :deactivate-disabled="!canModifyProgram"
            :disabled="loading"
            @deactivated="loadProgram(programId)"
          />
        </template>
      </header-navigator>
    </template>
    <template #alerts>
      <banner
        v-if="educationProgram && !allowProgramChanges"
        class="mb-2"
        :type="BannerTypes.Info"
        summary="This program can no longer be changed because it is associated with a program year that is no longer active."
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
import type { RouteLocationRaw } from "vue-router";
import {
  useFeatureToggles,
  useInstitutionAuth,
  useSnackBar,
} from "@/composables";
import type { BackTarget } from "@/types";
import { BannerTypes } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import ProgramActionsMenu from "@/components/institutions/education-programs/ProgramActionsMenu.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import { EducationProgramService } from "@/services/EducationProgramService";

interface ViewProgramProps {
  programId: number;
  /**
   * Program year selected in the manage programs, when accessed from there.
   * Allows the edit page to navigate back keeping the same program year selected.
   */
  programYearId?: number;
  backTarget: BackTarget;
}
const props = defineProps<ViewProgramProps>();
const snackBar = useSnackBar();
const loading = ref(true);
const educationProgram = ref<EducationProgramAPIOutDTO>();
const { isManageProgramsEnabled } = useFeatureToggles();
const { canModifyPrograms } = useInstitutionAuth();
const formTitle = computed(() => {
  if (!isManageProgramsEnabled.value) {
    return "Program";
  }
  return educationProgram.value
    ? `${educationProgram.value.programYearName} Program`
    : "Program";
});

/**
 * Indicates if the program can be edited or deactivated, which requires
 * the program to be active and the user to be allowed to modify programs.
 */
const canModifyProgram = computed(
  () => !!educationProgram.value?.isActive && canModifyPrograms.value,
);

/**
 * Indicates if the program can be changed (edited or deactivated), which
 * requires the program year of the program to have an active configuration.
 * Assumed false while the program is loading.
 */
const allowProgramChanges = computed(
  () => !!educationProgram.value?.hasActiveProgramYearConfiguration,
);

/**
 * Route to the edit program page, keeping the program year selected
 * to allow navigating back to the manage programs.
 */
const editProgramRoute = computed<RouteLocationRaw>(() => ({
  name: InstitutionRoutesConst.EDIT_PROGRAM,
  params: { programId: props.programId },
  query: { programYearId: props.programYearId },
}));

/**
 * Loads the education program to be displayed.
 * @param programId program to be loaded.
 */
const loadProgram = async (programId: number): Promise<void> => {
  try {
    loading.value = true;
    educationProgram.value =
      await EducationProgramService.shared.getEducationProgram(programId);
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};

watch(() => props.programId, loadProgram, { immediate: true });
</script>
