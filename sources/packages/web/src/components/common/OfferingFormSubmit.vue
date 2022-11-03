<template>
  <offering-form
    :submitLabel="submitLabel"
    :formMode="formMode"
    :processing="processing"
    :data="data"
    @loaded="formLoaded"
    @validateOffering="validateOffering"
    @saveOffering="saveOffering"
    @cancel="$emit('cancel')"
  ></offering-form>
  <confirm-modal
    title="Do you want to proceed?"
    cancelLabel="No"
    okLabel="Yes, proceed and submit offering for review"
    ref="offeringWarningsModal"
  >
    <template #content>
      <p>
        This offering does not meet policy requirements, therefore is ineligible
        for funding. If you wish to proceed, the offering will be submitted and
        assigned a "{{ OfferingStatus.CreationPending }}" status that will
        undergo a review by StudentAid BC.
        <strong>Are you sure you want to proceed?</strong>
      </p>
    </template>
  </confirm-modal>
</template>

<script lang="ts">
import {
  ApiProcessError,
  FormIOForm,
  OfferingFormModel,
  OfferingFormModes,
  OfferingStatus,
} from "@/types";
import { defineComponent, PropType, ref } from "vue";
import { ModalDialog, useFormioUtils, useSnackBar } from "@/composables";
import {
  EducationProgramOfferingAPIInDTO,
  OfferingValidationResultAPIOutDTO,
} from "@/services/http/dto";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { OFFERING_VALIDATION_ERROR } from "@/constants";
import OfferingForm from "@/components/common/OfferingForm.vue";

enum SaveOfferingResult {
  success,
  warning,
  error,
}

const FORMIO_WARNINGS_HIDDEN_FIELD_KEY = "warnings";

export default defineComponent({
  components: { OfferingForm, ConfirmModal },
  emits: ["cancel", "saved"],
  props: {
    data: {
      type: Object as PropType<OfferingFormModel>,
      required: true,
      default: {} as OfferingFormModel,
    },
    formMode: {
      type: String as PropType<OfferingFormModes>,
      required: true,
      default: OfferingFormModes.Readonly,
    },
    submitLabel: {
      type: String,
      required: false,
      default: "Submit",
    },
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
      required: false,
    },
  },
  setup(props, context) {
    const snackBar = useSnackBar();
    const { setComponentValue } = useFormioUtils();
    const processing = ref(false);
    const offeringWarningsModal = ref({} as ModalDialog<boolean>);

    // Keep the form reference once it is created
    // to use the setComponentValue later.
    let offeringForm: FormIOForm;
    const formLoaded = (form: FormIOForm) => {
      offeringForm = form;
    };

    const saveOfferingData = async (
      data: EducationProgramOfferingAPIInDTO,
      validationOnly = true,
      saveOnlyApproved = true,
    ): Promise<SaveOfferingResult> => {
      try {
        processing.value = true;
        await EducationProgramOfferingService.shared.saveProgramOffering(
          props.locationId,
          props.programId,
          data,
          { validationOnly, saveOnlyApproved },
          props.offeringId,
        );
        setFormWarnings([]);
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
            setFormWarnings(warningsTypes);
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

    /**
     * Set on form.io the array of warnings used to display the warnings banners.
     */
    const setFormWarnings = (warningsTypes: string[]) => {
      setComponentValue(
        offeringForm,
        FORMIO_WARNINGS_HIDDEN_FIELD_KEY,
        warningsTypes,
      );
    };

    /**
     * Move the screen to the first warning banner, is any.
     */
    const scrollToWarningBanner = () => {
      const [firstWarningBanner] =
        document.getElementsByClassName("banner-warning");
      if (firstWarningBanner) {
        firstWarningBanner.scrollIntoView({
          behavior: "smooth",
        });
      }
    };

    const validateOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      const validationResult = await saveOfferingData(data);
      if (validationResult === SaveOfferingResult.success) {
        snackBar.success(
          "Offering was validated successfully and no warnings were found.",
        );
      } else if (validationResult === SaveOfferingResult.warning) {
        scrollToWarningBanner();
      }
    };

    const saveOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      const saveOnlyApproval =
        props.formMode === OfferingFormModes.AssessmentDataReadonly
          ? false
          : true;
      let saveResult = await saveOfferingData(data, false, saveOnlyApproval);
      if (saveResult === SaveOfferingResult.warning) {
        const proceedWithWarnings =
          await offeringWarningsModal.value.showModal();
        if (proceedWithWarnings) {
          saveResult = await saveOfferingData(data, false, false);
        } else {
          scrollToWarningBanner();
        }
      }
      if (saveResult === SaveOfferingResult.success) {
        snackBar.success("Offering saved.");
        context.emit("saved");
      }
    };

    return {
      offeringWarningsModal,
      processing,
      validateOffering,
      saveOffering,
      formLoaded,
      OfferingStatus,
    };
  },
});
</script>
