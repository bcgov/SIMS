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
    <institution-restriction-banner
      :is-data-loaded-externally="true"
      :restriction-status="institutionRestrictionStatus"
    />
    <manage-program-and-offering-summary
      :program-id="programId"
      :location-id="locationId"
      :education-program="educationProgram"
      :allow-edit="!isReadOnly"
      :allow-deactivate="!isReadOnly"
      :can-create-offering="canCreateOffering"
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
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";
import { useInstitutionAuth } from "@/composables";
import { EffectiveRestrictionStatus } from "@/types";
import { RestrictionService } from "@/services/RestrictionService";

export default defineComponent({
  components: {
    ManageProgramAndOfferingSummary,
    ProgramOfferingDetailHeader,
    InstitutionRestrictionBanner,
  },
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
    const institutionRestrictionStatus = ref<EffectiveRestrictionStatus>();
    const canCreateOffering = computed(
      () => !!institutionRestrictionStatus.value?.canCreateOffering,
    );
    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
    };

    const loadInitialData = async () => {
      await getEducationProgramAndOffering();
      institutionRestrictionStatus.value =
        await RestrictionService.shared.getEffectiveInstitutionRestrictionStatus(
          props.locationId,
          props.programId,
        );
    };

    const isReadOnly = computed(() => {
      return isReadOnlyUser(props.locationId);
    });

    onMounted(loadInitialData);

    const programDataUpdated = () => getEducationProgramAndOffering();

    return {
      educationProgram,
      InstitutionRoutesConst,
      programDataUpdated,
      isReadOnly,
      canCreateOffering,
      institutionRestrictionStatus,
    };
  },
});
</script>
