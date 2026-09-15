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
        v-if="canEditOnlyBasicInfo"
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
      :read-only="readOnly"
      :program-id="programId"
      @loaded="loaded"
      @submitted="submit"
      @cancel="goBack"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { useFormioUtils, useInstitutionAuth, useSnackBar } from "@/composables";
import { computed, ref } from "vue";
import type { BackTarget } from "@/types";
import {
  ApiProcessError,
  BannerTypes,
  InstitutionRestrictionDisplayScope,
} from "@/types";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";
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
const canEditOnlyBasicInfo = ref(false);
const { isReadOnlyUser } = useInstitutionAuth();
const readOnly = computed(() => isReadOnlyUser(props.locationId));
const { excludeExtraneousValues } = useFormioUtils();
const processing = ref(false);

const submit = async (program: EducationProgramAPIInDTO) => {
  processing.value = true;
  try {
    const typedData = excludeExtraneousValues(
      EducationProgramAPIInDTO,
      program,
    );
    await EducationProgramService.shared.updateEducationProgram(
      props.programId,
      typedData,
    );
    snackBar.success("Education Program updated successfully!");
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

const loaded = (program: EducationProgramAPIOutDTO) => {
  canEditOnlyBasicInfo.value = program.hasOfferings;
};

const goBack = async (): Promise<void> => {
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
