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
            @click="createNewProgram"
            class="btn-font-color-light"
            v-if="!readOnly"
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
      :program-configuration="educationProgram"
      :is-loading="loading"
      :is-read-only="isFormReadOnly"
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
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";
import { EducationProgramService } from "@/services/EducationProgramService";

interface EditProgramProps {
  locationId: number;
  programId: number;
  backTarget: BackTarget;
}

const snackBar = useSnackBar();
const props = defineProps<EditProgramProps>();
const router = useRouter();
const { isReadOnlyUser } = useInstitutionAuth();
const { isManageProgramsEnabled } = useFeatureToggles();
const readOnly = computed(() => isReadOnlyUser(props.locationId));
const processing = ref(false);
const loading = ref(true);
const educationProgram = ref<EducationProgramAPIOutDTO>();
const formTitle = computed(() => {
  if (!isManageProgramsEnabled.value) {
    return "Program";
  }
  return educationProgram.value
    ? `Program Edit for ${educationProgram.value.programYearName}`
    : "Program";
});

const isFullUpdateRestricted = computed(
  () => !!educationProgram.value?.programData.context.isFullUpdateRestricted,
);
/**
 * Inactive or expired programs can no longer be edited.
 */
const isFormReadOnly = computed(
  () =>
    readOnly.value ||
    !educationProgram.value?.isActive ||
    educationProgram.value.isExpired,
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

const submit = async (programData: Record<string, unknown>) => {
  processing.value = true;
  try {
    await EducationProgramService.shared.updateEducationProgram(
      props.programId,
      { programData },
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

const createNewProgram = () => {
  router.push({
    name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
    params: {
      locationId: props.locationId,
    },
  });
};
</script>
