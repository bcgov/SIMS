<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="programDetailRoute"
        subTitle="Request to Change"
      />
      <program-offering-detail-header
        v-if="offeringId"
        class="m-4"
        :headerDetails="{
          ...initialData,
          status: initialData.offeringStatus,
          institutionId: institutionId,
        }"
      />
    </template>
    <template #alerts>
      <banner
        class="mb-2"
        :type="BannerTypes.Warning"
        header="You're requesting a change when students have applied financial aid for this offering"
        summary="Please be advised if the request is approved, the students who applied for financial aid for this offering will go through a reassessment and it may change their funding amount."
      />
    </template>
    <offering-form-submit
      :data="initialData"
      :readOnly="false"
      @saveOffering="saveOffering"
    ></offering-form-submit>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { onMounted, ref, computed } from "vue";
import { OfferingStatus } from "@/types";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import { useSnackBar } from "@/composables";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingFormSubmit from "@/components/common/OfferingFormSubmit.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingFormSubmit,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
  },

  setup(props: any) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const initialData = ref({} as EducationProgramOfferingAPIOutDTO);
    const programDetailRoute = computed(() => ({
      name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
        offeringId: props.offeringId,
      },
    }));

    const loadFormData = async () => {
      initialData.value =
        await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
          props.locationId,
          props.programId,
          props.offeringId,
        );
    };
    onMounted(async () => {
      await loadFormData();
    });
    const saveOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        await EducationProgramOfferingService.shared.requestChange(
          props.locationId,
          props.programId,
          props.offeringId,
          data,
        );
        snackBar.success("Request for change has been submitted.");
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } catch (error: unknown) {
        snackBar.error(
          "An error happened while requesting a change to the offering.",
        );
      }
    };
    return {
      saveOffering,
      initialData,
      programDetailRoute,
      OfferingStatus,
      BannerTypes,
    };
  },
};
</script>
