<template>
  <full-page-container :full-width="true" layout-template="centered">
    <template #header>
      <header-navigator
        title="Programs"
        :routeLocation="{
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: { locationId: locationId },
        }"
        subTitle="Program Detail"
      />
    </template>
    <template #details-header>
      <program-offering-detail-header
        :headerDetails="{
          ...educationProgram,
          institutionId: institutionId,
          status: educationProgram.programStatus,
        }"
      />
    </template>
    <manage-program-and-offering-summary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted } from "vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";

export default {
  components: { ManageProgramAndOfferingSummary, ProgramOfferingDetailHeader },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const educationProgram = ref({} as EducationProgramAPIOutDTO);
    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
    };

    onMounted(getEducationProgramAndOffering);

    return {
      educationProgram,
      InstitutionRoutesConst,
    };
  },
};
</script>
