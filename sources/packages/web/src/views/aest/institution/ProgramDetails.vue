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
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
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
    institutionId: {
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
      educationProgram.value = await EducationProgramService.shared.getEducationProgramForAEST(
        props.programId,
      );
    };
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROGRAMS,
        params: {
          institutionId: props.institutionId,
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
