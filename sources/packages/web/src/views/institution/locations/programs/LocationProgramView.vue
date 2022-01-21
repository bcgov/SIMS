<template>
  <v-container>
    <div class="mb-4">
      <p class="muted-heading-text">
        <a @click="goBack()"> Programs</a>
      </p>
      <p class="heading-x-large">Program Detail</p>
    </div>
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
    />
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import {
  EducationProgramOfferingDto,
  EducationProgramDto,
  ProgramIntensity,
} from "@/types";
import { useFormatStatuses } from "@/composables";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";

export default {
  components: { ManageProgramAndOfferingSummary },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const { getProgramStatusToGeneralStatus } = useFormatStatuses();

    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        params: {
          programId: props.programId,
          locationId: props.locationId,
          locationName: props.locationName,
        },
      });
    };

    const goToEditProgram = () => {
      router.push({
        name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
        params: { programId: props.programId, locationId: props.locationId },
      });
    };

    const goToAddNewOffering = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        params: { locationId: props.locationId, programId: props.programId },
      });
    };

    const goToEditOffering = (offeringId: number) => {
      router.push({
        name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
        params: {
          offeringId: offeringId,
          programId: props.programId,
          locationId: props.locationId,
        },
      });
    };

    const offerings = ref([] as EducationProgramOfferingDto[]);
    const educationProgram = ref({} as EducationProgramDto);
    const getEducationProgramAndOffering = async () => {
      const offeringsRequest = EducationProgramOfferingService.shared.getAllEducationProgramOffering(
        props.locationId,
        props.programId,
      );
      const educationProgramRequest = EducationProgramService.shared.getEducationProgram(
        props.programId,
      );
      const [offeringsValue, educationProgramValue] = await Promise.all([
        offeringsRequest,
        educationProgramRequest,
      ]);
      offerings.value = offeringsValue;
      educationProgram.value = educationProgramValue;
    };

    onMounted(getEducationProgramAndOffering);

    return {
      goBack,
      goToEditProgram,
      goToAddNewOffering,
      educationProgram,
      offerings,
      goToEditOffering,
      ProgramIntensity,
      getProgramStatusToGeneralStatus,
    };
  },
};
</script>
