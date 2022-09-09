<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="routeLocation"
        subTitle="Add offering"
      />
    </template>
    <offering-form
      :data="initialData"
      :readOnly="false"
      @saveOffering="saveOffering"
      :processing="processing"
    ></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import { OfferingFormCreateModel, OfferingStatus } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog } from "@/composables";
import {
  OfferingAssessmentAPIInDTO,
  EducationProgramOfferingAPIInDTO,
} from "@/services/http/dto";
import OfferingForm from "@/components/common/OfferingForm.vue";
import { BannerTypes } from "@/types/contracts/Banner";

export default {
  components: {
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
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const processing = ref(false);
    const initialData = ref({} as OfferingFormCreateModel);
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );

    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
      },
    }));

    const loadFormData = async () => {
      const programDetails =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
      initialData.value = {
        programIntensity: programDetails.programIntensity,
        programDeliveryTypes: programDetails.programDeliveryTypes,
        hasWILComponent: programDetails.hasWILComponent,
      };
    };
    onMounted(async () => {
      await loadFormData();
    });

    const saveOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        processing.value = true;
        await EducationProgramOfferingService.shared.createProgramOffering(
          props.locationId,
          props.programId,
          data,
        );
        snackBar.success("Education Offering created successfully!");

        router.push(routeLocation.value);
      } catch {
        snackBar.error("An error happened during the Offering create process.");
      } finally {
        processing.value = false;
      }
    };

    return {
      saveOffering,
      initialData,
      InstitutionRoutesConst,
      OfferingStatus,
      assessOfferingModalRef,
      BannerTypes,
      routeLocation,
      processing,
    };
  },
};
</script>
