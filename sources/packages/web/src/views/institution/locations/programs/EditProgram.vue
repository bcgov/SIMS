<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
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
        :location-id="locationId"
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
import {
  useFeatureToggles,
  useInstitutionAuth,
  useSnackBar,
} from "@/composables";
import { computed, ref, watch } from "vue";
import type { BackTarget } from "@/types";
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
  /**
   * Location from where the program is being edited, when accessed from the
   * location programs. Not provided when accessed from the manage programs.
   */
  locationId?: number;
  programId: number;
  /**
   * Program year selected in the manage programs, when accessed from there.
   */
  programYearId?: number;
  backTarget: BackTarget;
}

const snackBar = useSnackBar();
const props = defineProps<EditProgramProps>();
const router = useRouter();
const { isReadOnlyUser } = useInstitutionAuth();
const { isManageProgramsEnabled } = useFeatureToggles();
/**
 * Read-only access is defined per location. When no location is provided,
 * the route authorization already prevents read-only users.
 */
const readOnly = computed(() =>
  props.locationId ? isReadOnlyUser(props.locationId) : false,
);
const processing = ref(false);
const loading = ref(true);
const programConfiguration = ref<EducationProgramConfigurationAPIOutDTO>();
const formTitle = computed(() => {
  if (!isManageProgramsEnabled.value) {
    return "Program";
  }
  return programConfiguration.value
    ? `Program Edit for ${programConfiguration.value.programYearName}`
    : "Program";
});

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

const goBack = (): void => {
  router.push(props.backTarget.to);
};

/**
 * Route to create a new program, based on where the program is being edited from.
 * - Location programs: create the program from the location.
 * - Manage programs: create the program for the selected program year.
 */
const createProgramRoute = computed<RouteLocationRaw | undefined>(() => {
  if (props.locationId) {
    return {
      name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
      params: { locationId: props.locationId },
    };
  }
  if (props.programYearId) {
    return {
      name: InstitutionRoutesConst.CREATE_PROGRAM,
      params: { programYearId: props.programYearId },
    };
  }
  return undefined;
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
