<template>
  <full-page-container :full-width="true" layout-template="centered-card">
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
    <template #alerts>
      <institution-restriction-banner
        :scope="InstitutionRestrictionDisplayScope.Program"
        :location-id="locationId"
        :program-id="programId"
      />
    </template>
    <manage-program-and-offering-summary
      :program-id="programId"
      :location-id="locationId"
      :education-program="educationProgram"
      :allow-edit="!isReadOnly"
      :allow-deactivate="!isReadOnly"
      :can-create-offering="effectiveRestrictionState.canCreateOffering"
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
import {
  useInstitutionAuth,
  useInstitutionRestrictionState,
} from "@/composables";
import { InstitutionRestrictionDisplayScope } from "@/types";

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
    const { getEffectiveRestrictionState } = useInstitutionRestrictionState();
    const educationProgram = ref({} as EducationProgramAPIOutDTO);
    const effectiveRestrictionState = getEffectiveRestrictionState(() => ({
      scope: InstitutionRestrictionDisplayScope.Program,
      locationId: props.locationId,
      programId: props.programId,
    }));
    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
    };

    const loadInitialData = async () => {
      await getEducationProgramAndOffering();
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
      effectiveRestrictionState,
      InstitutionRestrictionDisplayScope,
    };
  },
});
</script>
