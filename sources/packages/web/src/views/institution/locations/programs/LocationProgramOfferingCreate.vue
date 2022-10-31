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
      @validateOffering="validateOffering"
      @saveOffering="saveOffering"
      :processing="processing"
      submitLabel="Add offering now"
      @cancel="goBack"
    ></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import {
  ApiProcessError,
  OfferingFormCreateModel,
  OfferingStatus,
} from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog } from "@/composables";
import {
  OfferingAssessmentAPIInDTO,
  EducationProgramOfferingAPIInDTO,
} from "@/services/http/dto";
import OfferingForm from "@/components/common/OfferingForm.vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { OFFERING_VALIDATION_ERROR } from "@/constants";

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

    const goBack = () => {
      router.push(routeLocation.value);
    };

    const validateOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        processing.value = true;
        await EducationProgramOfferingService.shared.createProgramOffering(
          props.locationId,
          props.programId,
          true,
          false,
          data,
        );
        snackBar.success(
          "Offering was validated successfully and no warnings were found.",
        );
      } catch (error: unknown) {
        console.log(error);
        if (
          error instanceof ApiProcessError &&
          error.errorType === OFFERING_VALIDATION_ERROR
        ) {
          console.log(OFFERING_VALIDATION_ERROR);
          snackBar.error(JSON.stringify(error.objectInfo));
          return;
        }
        snackBar.error("An error happened while validating the offering.");
      } finally {
        processing.value = false;
      }
    };

    const saveOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        processing.value = true;
        await EducationProgramOfferingService.shared.createProgramOffering(
          props.locationId,
          props.programId,
          false,
          false,
          data,
        );
        snackBar.success("Education Offering created successfully!");
        goBack();
      } catch {
        snackBar.error("An error happened during the Offering create process.");
      } finally {
        processing.value = false;
      }
    };

    return {
      validateOffering,
      saveOffering,
      initialData,
      InstitutionRoutesConst,
      OfferingStatus,
      assessOfferingModalRef,
      BannerTypes,
      routeLocation,
      processing,
      goBack,
    };
  },
};
</script>
