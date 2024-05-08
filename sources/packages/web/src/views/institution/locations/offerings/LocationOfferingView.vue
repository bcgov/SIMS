<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="routeLocation"
        subTitle="View Offering"
      >
      </header-navigator>
    </template>
    <template #alerts>
      <banner
        v-if="hasExistingApplication"
        class="mb-2"
        :type="BannerTypes.Success"
        header="Students have applied financial aid for this offering"
        summary="You can still make changes to the name. If you need edit the locked fields, please click on the edit actions menu and request to edit."
      />
    </template>
    <template #details-header>
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
import { OfferingStatus } from "@/types";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";
import { BannerTypes } from "@/types/contracts/Banner";

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
    const hasExistingApplication = computed(
      () =>
        initialData.value.hasExistingApplication &&
        initialData.value.offeringStatus === OfferingStatus.Approved,
    );
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
      hasExistingApplication,
      OfferingStatus,
      routeLocation,
      BannerTypes,
    };
  },
});
</script>
