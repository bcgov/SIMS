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
      submitLabel="Add offering now"
      :readOnly="false"
      :processing="processing"
      @loaded="formLoaded"
      @validateOffering="validateOffering"
      @saveOffering="saveOffering"
      @cancel="goBack"
    ></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { ref, computed, defineComponent } from "vue";
import { ApiProcessError, FormIOForm, OfferingStatus } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog, useFormioUtils } from "@/composables";
import {
  OfferingAssessmentAPIInDTO,
  EducationProgramOfferingAPIInDTO,
  OfferingValidationResultAPIOutDTO,
} from "@/services/http/dto";
import OfferingForm from "@/components/common/OfferingForm.vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { OFFERING_VALIDATION_ERROR } from "@/constants";

export default defineComponent({
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
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const processing = ref(false);
    const { setComponentValue } = useFormioUtils();
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );

    let offeringForm: FormIOForm;

    const formLoaded = (form: FormIOForm) => {
      offeringForm = form;
    };

    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
      },
    }));

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
        if (
          error instanceof ApiProcessError &&
          error.errorType === OFFERING_VALIDATION_ERROR
        ) {
          const validationResult =
            error.objectInfo as OfferingValidationResultAPIOutDTO;
          if (
            validationResult.offeringStatus === OfferingStatus.CreationPending
          ) {
            const warningsTypes = validationResult.warnings.map(
              (warning) => warning.warningType,
            );
            setComponentValue(offeringForm, "warnings", warningsTypes);
          }
          return;
        }
        snackBar.error(
          "An unexpected error happened while validating the offering.",
        );
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
      formLoaded,
      validateOffering,
      saveOffering,
      InstitutionRoutesConst,
      OfferingStatus,
      assessOfferingModalRef,
      BannerTypes,
      routeLocation,
      processing,
      goBack,
    };
  },
});
</script>
