<template>
  <div class="p-m-4">
    <HeaderNavigator
      title="Back all programs"
      :routeLocation="{
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        params: { locationId: locationId },
      }"
      subTitle="View program"
    >
    </HeaderNavigator>

    <v-container>
      <ManageProgramAndOfferingSummary
        :programId="programId"
        :locationId="locationId"
        :educationProgram="educationProgram"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted } from "vue";
import { EducationProgramData } from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { ManageProgramAndOfferingSummary, HeaderNavigator },
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
    const educationProgram = ref({} as EducationProgramData);
    const getEducationProgramAndOffering = async () => {
      educationProgram.value = await EducationProgramService.shared.getEducationProgram(
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
