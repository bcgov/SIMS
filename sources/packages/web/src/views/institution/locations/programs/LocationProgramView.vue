<template>
  <div class="p-m-4">
    <header-navigator
      title="Back all programs"
      :routeLocation="{
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        params: { locationId: locationId },
      }"
      subTitle="View program"
    />
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
    />
  </div>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted } from "vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramDetailsAPIOutDTO } from "@/services/http/dto";

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
  },
  setup(props: any) {
    const educationProgram = ref({} as EducationProgramDetailsAPIOutDTO);
    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgramDetails(
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
