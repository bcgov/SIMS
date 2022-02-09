<template>
  <v-container>
    <div class="mb-4">
      <p class="muted-heading-text">
        <a @click="goBack()">
          <v-icon left> mdi-arrow-left </v-icon> Back all programs</a
        >
      </p>
      <p class="heading-x-large">View program</p>
    </div>
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
    />
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted } from "vue";
import { EducationProgramData } from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";

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
    const router = useRouter();
    const educationProgram = ref({} as EducationProgramData);

    const getEducationProgramAndOffering = async () => {
      educationProgram.value = await EducationProgramService.shared.getEducationProgram(
        props.programId,
      );
    };
    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
        },
      });
    };

    onMounted(getEducationProgramAndOffering);
    return {
      goBack,
      educationProgram,
    };
  },
};
</script>
