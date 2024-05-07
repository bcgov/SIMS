<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Study period offerings"
        :routeLocation="routeLocation"
        subTitle="View Request"
      >
      </header-navigator>
      <program-offering-detail-header
        class="m-4"
        :headerDetails="{
          ...initialData,
          status: initialData.offeringStatus,
        }"
      />
    </template>
    <offering-form :data="initialData"></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { onMounted, ref, computed, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { EducationProgramOfferingAPIOutDTO } from "@/services/http/dto";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default defineComponent({
  components: {
    ProgramOfferingDetailHeader,
    OfferingForm,
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
    const initialData = ref({} as EducationProgramOfferingAPIOutDTO);
    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
      },
    }));
    const loadFormData = async () => {
      initialData.value =
        await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
          props.locationId,
          props.programId,
          props.offeringId,
        );
    };
    onMounted(async () => {
      await loadFormData();
    });
    return {
      initialData,
      routeLocation,
    };
  },
});
</script>
