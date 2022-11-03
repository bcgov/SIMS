<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program detail"
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
      :submitMode="OfferingSubmitModes.ChangeRequest"
      :locationId="locationId"
      :programId="programId"
      :offeringId="offeringId"
      @saved="gotToViewLocationPrograms"
      @cancel="goToEditLocationOfferings"
    ></offering-form-submit>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { onMounted, ref, defineComponent } from "vue";
import {
  OfferingFormModes,
  OfferingStatus,
  OfferingSubmitModes,
} from "@/types";
import { EducationProgramOfferingAPIOutDTO } from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingFormSubmit from "@/components/common/OfferingFormSubmit.vue";

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

    const gotToViewLocationPrograms = () => {
      router.push({
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        params: {
          programId: props.programId,
          locationId: props.locationId,
        },
      });
    };

    onMounted(async () => {
      initialData.value =
        await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
          props.locationId,
          props.programId,
          props.offeringId,
        );
    });

    return {
      initialData,
      OfferingStatus,
      BannerTypes,
      OfferingFormModes,
      OfferingSubmitModes,
      editLocationOfferingsRoute,
      goToEditLocationOfferings,
      gotToViewLocationPrograms,
    };
  },
});
</script>
