<template>
  <full-page-container :full-width="true" layout-template="centered">
    <template #header>
      <header-navigator
        title="Programs"
        :route-location="{
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: { locationId: locationId },
        }"
        sub-title="Program Detail"
        data-cy="programDetailHeader"
      />
    </template>
    <template #details-header>
      <program-offering-detail-header
        :header-details="{
          ...educationProgram,
          status: educationProgram.programStatus,
        }"
      />
    </template>
    <manage-program-and-offering-summary
      :program-id="programId"
      :location-id="locationId"
      :education-program="educationProgram"
      :allow-edit="!isReadOnly"
      :allow-deactivate="!isReadOnly"
      @program-data-updated="programDataUpdated"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted, defineComponent, computed } from "vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import { useInstitutionAuth } from "@/composables";

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
    const { isReadOnlyUser } = useInstitutionAuth();
    const educationProgram = ref({} as EducationProgramAPIOutDTO);
    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
    };

    const isReadOnly = computed(() => {
      return isReadOnlyUser(props.locationId);
    });

    onMounted(getEducationProgramAndOffering);

    const programDataUpdated = () => getEducationProgramAndOffering();

    return {
      educationProgram,
      InstitutionRoutesConst,
      programDataUpdated,
      isReadOnly,
    };
  },
});
</script>
