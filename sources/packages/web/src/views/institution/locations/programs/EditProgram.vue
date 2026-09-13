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
      @cancel="cancel"
    />
  </full-page-container>
</template>
<script setup lang="ts">
import { useInstitutionAuth, useSnackBar } from "@/composables";
import { computed, ref } from "vue";
import type { BackTarget, ProgramFormModel } from "@/types";
import { BannerTypes, InstitutionRestrictionDisplayScope } from "@/types";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";

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

const submit = async (program: ProgramFormModel) => {
  console.log("Program updated:", program);
  snackBar.success("Program edited successfully");
};
const cancel = async () => {
  router.push(props.backTarget.to);
};

const loaded = (program: EducationProgramAPIOutDTO) => {
  canEditOnlyBasicInfo.value = program.hasOfferings;
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
