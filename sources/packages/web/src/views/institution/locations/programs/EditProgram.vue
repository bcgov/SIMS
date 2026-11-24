<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Manage Programs"
        :route-location="manageProgramsRoute"
        sub-title="Edit Program"
      />
    </template>
    <template #alerts>
      <banner
        v-if="isFullUpdateRestricted"
        :type="BannerTypes.Success"
        header="Program details no longer editable"
        summary="This program has study period offerings attached to it, and the program details can no longer be edited. If revisions are required other than to program name or program description, you must create a new program with the correct details."
      >
        <template #actions>
          <v-btn
            color="success"
            :to="createProgramRoute"
            class="btn-font-color-light"
            v-if="!readOnly && createProgramRoute"
          >
            Create program
          </v-btn>
        </template>
      </banner>
      <institution-restriction-banner
        :scope="InstitutionRestrictionDisplayScope.Program"
        :program-id="programId"
      />
    </template>
    <program-form
      :title="formTitle"
      :program-configuration="programConfiguration"
      :is-loading="loading"
      :is-read-only="readOnly"
      :is-processing="processing"
      @submit="submit"
      @cancel="goBack"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { useInstitutionAuth, useSnackBar } from "@/composables";
import { computed, ref, watch } from "vue";
import {
  ApiProcessError,
  BannerTypes,
  InstitutionRestrictionDisplayScope,
} from "@/types";
import { useRouter } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import { EducationProgramConfigurationAPIOutDTO } from "@/services/http/dto";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";
import { EducationProgramService } from "@/services/EducationProgramService";

interface EditProgramProps {
  programId: number;
}

const snackBar = useSnackBar();
const props = defineProps<EditProgramProps>();
const router = useRouter();
const { canModifyPrograms } = useInstitutionAuth();
/**
 * The user must be allowed to modify programs, matching the API authorization.
 * The route authorization does not prevent read-only users from accessing
 * routes without a location.
 */
const readOnly = computed(() => !canModifyPrograms.value);
const processing = ref(false);
const loading = ref(true);
const programConfiguration = ref<EducationProgramConfigurationAPIOutDTO>();
const formTitle = computed(() =>
  programConfiguration.value
    ? `Program Edit for ${programConfiguration.value.programYearName}`
    : "Program",
);

const isFullUpdateRestricted = computed(
  () =>
    !!programConfiguration.value?.programData.context.isFullUpdateRestricted,
);
const submit = async (programData: Record<string, unknown>) => {
  if (!programConfiguration.value) {
    snackBar.error("Program data was not loaded.");
    return;
  }
  processing.value = true;
  try {
    await EducationProgramService.shared.updateEducationProgram(
      props.programId,
      {
        programData,
        programConfigurationId: programConfiguration.value.configurationId,
        isFullUpdateRestricted: isFullUpdateRestricted.value,
      },
    );
    snackBar.success("Education Program updated successfully!");
    goBack();
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

/**
 * Route back to the manage programs, selecting the program year of the
 * program once it is loaded.
 */
const manageProgramsRoute = computed<RouteLocationRaw>(() => ({
  name: InstitutionRoutesConst.MANAGE_PROGRAMS,
  params: programConfiguration.value
    ? { programYearId: programConfiguration.value.programYearId }
    : undefined,
}));

const goBack = (): void => {
  router.push(manageProgramsRoute.value);
};

/**
 * Route to create a new program for the program year of the program being edited.
 */
const createProgramRoute = computed<RouteLocationRaw | undefined>(() => {
  if (!programConfiguration.value) {
    return undefined;
  }
  return {
    name: InstitutionRoutesConst.CREATE_PROGRAM,
    params: { programYearId: programConfiguration.value.programYearId },
  };
});

watch(
  () => props.programId,
  async (programId) => {
    try {
      loading.value = true;
      programConfiguration.value =
        await EducationProgramService.shared.getEducationProgramConfigurationForUpdate(
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
