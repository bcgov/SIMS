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
    <offering-form
      :data="initialData"
      :readOnly="false"
      @saveOffering="saveOffering"
    ></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import { OfferingFormEditModel, OfferingStatus, OfferingDTO } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar } from "@/composables";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingForm,
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
    const initialData = ref({} as OfferingFormEditModel);
    const programDetailRoute = computed(() => ({
      name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
        offeringId: props.offeringId,
      },
    }));

    const loadFormData = async () => {
      const programDetails = await EducationProgramService.shared.getProgram(
        props.programId,
      );
      const programOffering =
        await EducationProgramOfferingService.shared.getProgramOffering(
          props.locationId,
          props.programId,
          props.offeringId,
        );
      initialData.value = {
        ...programOffering,
        programIntensity: programDetails.programIntensity,
        programDeliveryTypes: programDetails.programDeliveryTypes,
        hasWILComponent: programDetails.hasWILComponent,
        hasExistingApplication: false,
      };
    };
    onMounted(async () => {
      await loadFormData();
    });
    const saveOffering = async (data: OfferingDTO) => {
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
