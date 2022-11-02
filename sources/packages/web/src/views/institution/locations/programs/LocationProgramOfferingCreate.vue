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
      @saveOffering="createOffering"
      @cancel="goBack"
    ></offering-form>
    <confirm-modal
      title="Offering does not meet policy requirements"
      cancelLabel="No"
      okLabel="Yes, proceed"
      ref="offeringWarningsModal"
    >
      <template #content>
        <p>
          This offering is ineligible for funding. If you wish to proceed, the
          offering will be created with a "{{ OfferingStatus.CreationPending }}"
          status and will require StudentAid BC to review and approve the
          offering.<br />
          <strong>Are you sure you want to proceed?</strong>
        </p>
        <p>
          <strong>Note:</strong> you can click "no" and review your offering.
        </p>
      </template>
    </confirm-modal>
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
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";

enum SaveOfferingResult {
  success,
  warning,
  error,
}

export default defineComponent({
  components: {
    OfferingForm,
    ConfirmModal,
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
    const offeringWarningsModal = ref({} as ModalDialog<boolean>);

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

    const saveOfferingData = async (
      data: EducationProgramOfferingAPIInDTO,
      validationOnly = true,
      allowOnlyApproved = true,
    ): Promise<SaveOfferingResult> => {
      try {
        processing.value = true;
        await EducationProgramOfferingService.shared.createProgramOffering(
          props.locationId,
          props.programId,
          validationOnly,
          allowOnlyApproved,
          data,
        );
        setComponentValue(offeringForm, "warnings", []);
        return SaveOfferingResult.success;
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
          const [firstWarningBanner] =
            document.getElementsByClassName("banner-warning");
          if (firstWarningBanner) {
            firstWarningBanner.scrollIntoView({
              behavior: "smooth",
            });
          }
          return SaveOfferingResult.warning;
        }
        snackBar.error(
          "An unexpected error happened while validating the offering.",
        );
        return SaveOfferingResult.error;
      } finally {
        processing.value = false;
      }
    };

    const validateOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      const validationResult = await saveOfferingData(data);
      if (validationResult === SaveOfferingResult.success) {
        snackBar.success(
          "Offering was validated successfully and no warnings were found.",
        );
      }
    };

    const createOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      let saveResult = await saveOfferingData(data, false, true);
      if (saveResult === SaveOfferingResult.warning) {
        const proceedWithWarnings =
          await offeringWarningsModal.value.showModal();
        if (proceedWithWarnings) {
          saveResult = await saveOfferingData(data, false, false);
        }
      }
      if (saveResult === SaveOfferingResult.success) {
        snackBar.success("Offering created.");
        goBack();
      }
    };

    return {
      formLoaded,
      validateOffering,
      createOffering,
      offeringWarningsModal,
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
