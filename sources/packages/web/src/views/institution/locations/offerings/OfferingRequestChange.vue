<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Edit Offering"
        :routeLocation="editLocationOfferingsRoute"
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
      submitLabel="Request a change now"
      :data="initialData"
      :formMode="OfferingFormModes.Editable"
      :locationId="locationId"
      :programId="programId"
      @submit="submit"
      @cancel="goToEditLocationOfferings"
    ></offering-form-submit>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { onMounted, ref, defineComponent } from "vue";
import { OfferingFormModes, OfferingStatus } from "@/types";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingFormSubmit from "@/components/common/OfferingFormSubmit.vue";
import { useSnackBar } from "@/composables";

export default defineComponent({
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
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const processing = ref(false);
    const initialData = ref({} as EducationProgramOfferingAPIOutDTO);
    const editLocationOfferingsRoute = {
      name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
        offeringId: props.offeringId,
      },
    };

    const goToEditLocationOfferings = () => {
      router.push(editLocationOfferingsRoute);
    };

    onMounted(async () => {
      initialData.value =
        await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
          props.locationId,
          props.programId,
          props.offeringId,
        );
    });

    const submit = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        processing.value = true;
        await EducationProgramOfferingService.shared.requestChange(
          props.locationId,
          props.programId,
          props.offeringId,
          data,
        );
        snackBar.success("Offering change requested.");
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } catch {
        snackBar.error(
          "Unexpected error happened while requesting the offering change.",
        );
      } finally {
        processing.value = false;
      }
    };

    return {
      initialData,
      OfferingStatus,
      BannerTypes,
      OfferingFormModes,
      editLocationOfferingsRoute,
      goToEditLocationOfferings,
      submit,
      processing,
    };
  },
});
</script>
