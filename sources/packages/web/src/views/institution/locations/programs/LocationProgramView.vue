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
      :location-id="locationId"
      :program-id="programId"
    />
    <manage-program-and-offering-summary
      :program-id="programId"
      :location-id="locationId"
      :education-program="educationProgram"
      :allow-edit="!isReadOnly"
      :allow-deactivate="!isReadOnly"
      :can-create-offering="effectiveRestrictionStatus.canCreateOffering"
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
    const { getEffectiveRestrictionStatus } = useInstitutionRestrictionState();
    const educationProgram = ref({} as EducationProgramAPIOutDTO);
    const effectiveRestrictionStatus = computed(() =>
      getEffectiveRestrictionStatus(props.locationId, props.programId),
    );
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
      effectiveRestrictionStatus,
    };
  },
});
</script>
