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
        data-cy="programDetailHeader"
      />
    </template>
    <template #details-header>
      <program-offering-detail-header
        :headerDetails="{
          ...educationProgram,
          status: educationProgram.programStatus,
        }"
        :locationId="$props.locationId"
      />
    </template>
    <manage-program-and-offering-summary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
      @program-data-updated="programDataUpdated"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted, defineComponent } from "vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";

export default defineComponent({
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
  setup(props) {
    const educationProgram = ref({} as EducationProgramAPIOutDTO);
    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
    };

    onMounted(getEducationProgramAndOffering);

    const programDataUpdated = () => getEducationProgramAndOffering();

    return {
      educationProgram,
      InstitutionRoutesConst,
      programDataUpdated,
    };
  },
});
</script>
