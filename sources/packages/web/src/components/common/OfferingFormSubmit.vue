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
  EducationProgramOfferingAPIOutDTO,
  OfferingValidationResultAPIOutDTO,
  ValidationResultAPIOutDTO,
} from "@/services/http/dto";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import OfferingForm from "@/components/common/OfferingForm.vue";

const FORMIO_WARNINGS_HIDDEN_FIELD_KEY = "validationWarnings";
const FORMIO_INFOS_HIDDEN_FIELD_KEY = "validationInfos";
const FORMIO_STUDY_PERIOD_BREAK_DOWN_KEY = "studyPeriodBreakdown";
const FORMIO_EXECUTE_CALCULATION_TAG = "execute-calculation";
const FORMIO_EXECUTE_VALIDATION_TAG = "execute-validation";

export default defineComponent({
  components: { OfferingForm, ConfirmModal },
  emits: {
    cancel: null,
    submit: null,
  },
  props: {
    data: {
      type: Object as PropType<
        EducationProgramOfferingAPIOutDTO | OfferingFormModel
      >,
      default: {} as EducationProgramOfferingAPIOutDTO | OfferingFormModel,
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
    enableValidationsOnInit: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    const snackBar = useSnackBar();
    const { setComponentValue, excludeExtraneousValues } = useFormioUtils();
    const processing = ref(false);
    const offeringWarningsModal = ref({} as ModalDialog<boolean>);
    // Defines when the first manual validation happened to allow the
    // further validations to happen automatically when a component
    // tagged with FORMIO_EXECUTE_VALIDATION_TAG changes.
    let validationStarted = false;

    const allowValidation = (): boolean => {
      return validationStarted || props.enableValidationsOnInit;
    };

    // Keep the form reference once it is created
    // to use the setComponentValue later.
    let offeringForm: FormIOForm;
    const formLoaded = (form: FormIOForm) => {
      offeringForm = form;
    };

    let lastCalculationDate: Date | undefined = undefined;
    const validateOfferingData = async (
      data: EducationProgramOfferingAPIInDTO,
    ): Promise<OfferingValidationResultAPIOutDTO> => {
      const typedData = excludeExtraneousValues(
        EducationProgramOfferingAPIInDTO,
        data,
      );
      const validationResult =
        await EducationProgramOfferingService.shared.validateOffering(
          props.locationId,
          props.programId,
          typedData,
        );
      if (
        !lastCalculationDate ||
        validationResult.validationDate > lastCalculationDate
      ) {
        // Update the form component only if the API result is the most recent.
        validationResult.studyPeriodBreakdown.unfundedStudyPeriodDays =
          validationResult.studyPeriodBreakdown.unfundedStudyPeriodDays.toString();
        validationResult.studyPeriodBreakdown.totalDays =
          validationResult.studyPeriodBreakdown.totalDays.toString();
        validationResult.studyPeriodBreakdown.totalFundedWeeks =
          validationResult.studyPeriodBreakdown.totalFundedWeeks.toString();
        validationResult.studyPeriodBreakdown.fundedStudyPeriodDays =
          validationResult.studyPeriodBreakdown.fundedStudyPeriodDays.toString();
        setComponentValue(
          offeringForm,
          FORMIO_STUDY_PERIOD_BREAK_DOWN_KEY,
          validationResult.studyPeriodBreakdown,
        );
        const infoTypes = validationResult.infos.map((info) => info.typeCode);
        setComponentValue(
          offeringForm,
          FORMIO_INFOS_HIDDEN_FIELD_KEY,
          infoTypes,
        );
        // Avoid updating the validation fields if the validation was never manually requested.
        if (allowValidation()) {
          let warningsTypes: string[] = [];
          if (!validationResult.errors.length) {
            warningsTypes = validationResult.warnings.map(
              (warning) => warning.typeCode,
            );
          }
          setComponentValue(
            offeringForm,
            FORMIO_WARNINGS_HIDDEN_FIELD_KEY,
            warningsTypes,
          );
        }
      }
      return validationResult;
    };

    /**
     * Move the screen to the first warning banner, if any.
     */
    const scrollToWarningBanner = (warnings: ValidationResultAPIOutDTO[]) => {
      const [warningToScroll] = warnings;
      const warningBannerComponent = `formio-component-${warningToScroll.typeCode}`;
      const [warningBanner] = document.getElementsByClassName(
        warningBannerComponent,
      );
      if (warningBanner) {
        warningBanner.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };

    const validateOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      try {
        validationStarted = true;
        processing.value = true;
        const validationResult = await validateOfferingData(data);
        if (validationResult.offeringStatus === OfferingStatus.Approved) {
          snackBar.success(
            "Offering was validated successfully and no warnings were found.",
          );
        } else if (
          validationResult.offeringStatus === OfferingStatus.CreationPending
        ) {
          scrollToWarningBanner(validationResult.warnings);
        }
      } catch {
        snackBar.error(
          "Unexpected error happened during the offering validation.",
        );
      } finally {
        processing.value = false;
      }
    };

    const saveOffering = async (data: EducationProgramOfferingAPIInDTO) => {
      validationStarted = true;
      if (props.formMode === OfferingFormModes.AssessmentDataReadonly) {
        // No validations are needed to update basic offering data.
        context.emit("submit", data);
        return;
      }
      try {
        const validationResult = await validateOfferingData(data);
        switch (validationResult.offeringStatus) {
          case OfferingStatus.Approved:
            {
              // The offering is ready to be automatically approved.
              context.emit("submit", data);
            }
            break;
          case OfferingStatus.CreationPending:
            {
              // Offering need to be reviewed. User must agree to proceed.
              const proceedWithWarnings =
                await offeringWarningsModal.value.showModal();
              if (proceedWithWarnings) {
                // There are warnings but the user agreed to proceed.
                context.emit("submit", data);
              } else {
                scrollToWarningBanner(validationResult.warnings);
              }
            }
            break;
          default:
            {
              // All errors at this level are supposed to be dealt with at the form.io definition. If the server
              // validations are out of sync with the form, this message can help to quickly troubleshoot
              // the issue and allow the user to proceed. The expected messages to be displayed are the same
              // user-friendly messages also displayed during the offering bulk upload.
              snackBar.error(
                `Unexpected error(s) happened during the submission: ${validationResult.errors.join(
                  ", ",
                )}`,
              );
            }
            break;
        }
      } catch {
        snackBar.error(
          "Unexpected error while validating the offering to be saved.",
        );
      }
    };

    const formChanged = async (
      form: FormIOForm<EducationProgramOfferingAPIInDTO>,
      event: FormIOChangeEvent,
    ) => {
      if (
        event.changed?.component?.tags?.includes(
          FORMIO_EXECUTE_CALCULATION_TAG,
        ) ||
        (allowValidation() &&
          event.changed?.component?.tags?.includes(
            FORMIO_EXECUTE_VALIDATION_TAG,
          ))
      ) {
        await validateOfferingData(form.data);
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
