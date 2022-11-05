<template>
  <offering-form
    :submitLabel="submitLabel"
    :formMode="formMode"
    :processing="processing"
    :data="data"
    @loaded="formLoaded"
    @validateOffering="validateOffering"
    @saveOffering="saveOffering"
    @changed="formChanged"
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
  FormIOChangeEvent,
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
  StudyPeriodBreakdownAPIOutDTO,
} from "@/services/http/dto";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import OfferingForm from "@/components/common/OfferingForm.vue";

const FORMIO_WARNINGS_HIDDEN_FIELD_KEY = "warnings";
const FORMIO_STUDY_PERIOD_BREAK_DOWN_KEY = "studyPeriodBreakdown";

export default defineComponent({
  components: { OfferingForm, ConfirmModal },
  emits: {
    cancel: null,
    submit: null,
  },
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

    const validateOfferingData = async (
      data: EducationProgramOfferingAPIInDTO,
    ): Promise<OfferingValidationResultAPIOutDTO> => {
      try {
        processing.value = true;
        const validationResult =
          await EducationProgramOfferingService.shared.validateOffering(
            props.locationId,
            props.programId,
            data,
          );
        const warningsTypes = validationResult.warnings.map(
          (warning) => warning.warningType,
        );
        setComponentValue(
          offeringForm,
          FORMIO_WARNINGS_HIDDEN_FIELD_KEY,
          warningsTypes,
        );
        setCalculateStudyPeriodBreakdown(validationResult.studyPeriodBreakdown);
        return validationResult;
      } finally {
        processing.value = false;
      }
    };

    let lastCalculationDate: Date | undefined = undefined;
    const calculateStudyPeriodBreakdown = async (
      data: EducationProgramOfferingAPIInDTO,
    ): Promise<void> => {
      try {
        const validationResult =
          await EducationProgramOfferingService.shared.validateOffering(
            props.locationId,
            props.programId,
            data,
          );
        // Update the result only if it is the most updated received.
        if (
          !lastCalculationDate ||
          validationResult.validationDate > lastCalculationDate
        ) {
          setCalculateStudyPeriodBreakdown(
            validationResult.studyPeriodBreakdown,
          );
          lastCalculationDate = validationResult.validationDate;
        }
      } catch {
        setCalculateStudyPeriodBreakdown({} as StudyPeriodBreakdownAPIOutDTO);
      }
    };

    const setCalculateStudyPeriodBreakdown = (
      calculatedValues: StudyPeriodBreakdownAPIOutDTO,
    ) => {
      setComponentValue(
        offeringForm,
        FORMIO_STUDY_PERIOD_BREAK_DOWN_KEY,
        calculatedValues,
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
      try {
        const validationResult = await validateOfferingData(data);
        if (validationResult.offeringStatus === OfferingStatus.Approved) {
          snackBar.success(
            "Offering was validated successfully and no warnings were found.",
          );
        } else if (
          validationResult.offeringStatus === OfferingStatus.CreationPending
        ) {
          scrollToWarningBanner();
        }
      } catch {
        snackBar.error(
          "Unexpected error happened during the offering validation.",
        );
      }
    };

    const saveOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        const validationResult = await validateOfferingData(data);
        if (
          validationResult.offeringStatus === OfferingStatus.CreationPending
        ) {
          const proceedWithWarnings =
            await offeringWarningsModal.value.showModal();
          if (proceedWithWarnings) {
            // There are warnings but the user agreed to proceed.
            context.emit("submit", data);
          } else {
            scrollToWarningBanner();
          }
        }
        if (validationResult.offeringStatus === OfferingStatus.Approved) {
          // The offering is ready to be automatically approved.
          context.emit("submit", data);
        }
      } catch {
        snackBar.error(
          "Unexpected error while validating the offering to be saved.",
        );
      }
    };

    const formChanged = (
      form: FormIOForm<EducationProgramOfferingAPIInDTO>,
      event: FormIOChangeEvent,
    ) => {
      if (event.changed?.component?.tags?.includes("execute-calculation")) {
        calculateStudyPeriodBreakdown(form.data);
      }
    };

    return {
      offeringWarningsModal,
      processing,
      validateOffering,
      saveOffering,
      formLoaded,
      formChanged,
      OfferingStatus,
    };
  },
});
</script>
