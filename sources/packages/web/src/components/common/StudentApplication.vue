<template>
  <formio
    :formName="selectedForm"
    :data="formData"
    :readOnly="isReadOnly"
    @loaded="formLoaded"
    @changed="formChanged"
    @submitted="submitted"
    @render="formRender"
    @customEvent="customEvent"
  ></formio>
  <footer-buttons
    justify="space-between"
    :processing="processing"
    @primaryClick="wizardGoNext"
    @secondaryClick="wizardGoPrevious"
    :showPrimaryButton="!isLastPage"
    :showSecondaryButton="!isFirstPage"
    :primaryLabel="!isFirstPage ? 'Next section' : 'Start your application'"
    secondaryLabel="Previous section"
    class="mx-0"
  >
    <template #primary-buttons v-if="!isReadOnly && isLastPage">
      <!-- This section is loaded only for editable forms -->
      <span>
        <v-btn
          color="primary"
          v-if="isSaveDraftAllowed"
          variant="outlined"
          :loading="savingDraft"
          @click="$emit('saveDraft')"
        >
          {{ savingDraft ? "Saving..." : "Save draft" }}
        </v-btn>
        <v-btn
          v-if="!isFirstPage"
          class="ml-2"
          :disabled="processing"
          color="primary"
          @click="$emit('wizardSubmit')"
          :loading="processing"
        >
          {{ processing ? "Submitting..." : "Submit application" }}
        </v-btn>
      </span>
    </template>
  </footer-buttons>
</template>

<script lang="ts">
import {
  OfferingIntensity,
  WizardNavigationEvent,
  FormIOCustomEvent,
  FormIOForm,
  StudentApplicationFormData,
} from "@/types";
import { ref, watch, defineComponent, computed, PropType } from "vue";
import {
  useFormioComponentLoader,
  useFormioDropdownLoader,
  useFormioUtils,
} from "@/composables";

export default defineComponent({
  emits: [
    "formLoadedCallback",
    "submitApplication",
    "customEventCallback",
    "pageChanged",
    "saveDraft",
    "wizardSubmit",
    "render",
  ],
  props: {
    initialData: {
      type: Object as PropType<StudentApplicationFormData>,
      required: true,
    },
    selectedForm: {
      type: String,
      required: true,
    },
    isReadOnly: {
      type: Boolean,
      required: true,
    },
    programYearId: {
      type: Number,
      required: true,
    },
    processing: {
      type: Boolean,
      required: false,
    },
    notDraft: {
      type: Boolean,
      default: false,
    },
    savingDraft: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, context) {
    // Component's names on Form.IO definition that will be manipulated.
    const LOCATIONS_DROPDOWN_KEY = "selectedLocation";
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const SELECTED_OFFERING_START_DATE_KEY = "selectedOfferingDate";
    const SELECTED_OFFERING_END_DATE_KEY = "selectedOfferingEndDate";
    const SELECTED_PROGRAM_DESC_KEY = "selectedProgramDesc";
    const OFFERING_INTENSITY_KEY = "howWillYouBeAttendingTheProgram";
    const PROGRAM_NOT_LISTED = "myProgramNotListed";
    const OFFERING_NOT_LISTED = "myStudyPeriodIsntListed";
    let formInstance: any;
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const formioComponentLoader = useFormioComponentLoader();
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const showNav = ref(false);
    const formData = ref({} as StudentApplicationFormData);
    let offeringIntensity: OfferingIntensity;

    const isSaveDraftAllowed = computed(
      () => !props.notDraft && !isFirstPage.value && !props.processing,
    );

    const getSelectedId = (form: FormIOForm) => {
      return formioUtils.getComponentValueByKey(form, LOCATIONS_DROPDOWN_KEY);
    };

    const loadFormDependencies = async () => {
      if (formInstance && props.initialData) {
        formData.value = props.initialData;
        offeringIntensity = formData.value.applicationOfferingIntensityValue;
        const applicationIntensityComponent = formInstance.getComponent(
          OFFERING_INTENSITY_KEY,
        );
        // Program year forms older than 2025-26 required offering intensity to be injected to the form.
        // Check if the form has the offering intensity component and if so, inject the values.
        if (applicationIntensityComponent) {
          formData.value.howWillYouBeAttendingTheProgram =
            props.initialData.applicationOfferingIntensityValue;
        }
        // When the form is editable, load locations and programs.
        if (!props.isReadOnly) {
          await formioDataLoader.loadLocations(
            formInstance,
            LOCATIONS_DROPDOWN_KEY,
          );
          const selectedLocationId = getSelectedId(formInstance);

          if (selectedLocationId) {
            // when isReadOnly.value is true, then consider
            // both active and inactive program year.
            await formioDataLoader.loadProgramsForLocation(
              formInstance,
              +selectedLocationId,
              PROGRAMS_DROPDOWN_KEY,
              props.programYearId,
              props.isReadOnly,
            );
          }
          const selectedProgramId = formioUtils.getComponentValueByKey(
            formInstance,
            PROGRAMS_DROPDOWN_KEY,
          );

          if (selectedProgramId && offeringIntensity) {
            await formioComponentLoader.loadProgramDesc(
              formInstance,
              selectedProgramId,
              SELECTED_PROGRAM_DESC_KEY,
            );
            // when isReadOnly.value is true, then consider
            // both active and inactive program year.
            await formioDataLoader.loadOfferingsForLocation(
              formInstance,
              selectedProgramId,
              selectedLocationId,
              OFFERINGS_DROPDOWN_KEY,
              props.programYearId,
              offeringIntensity,
              props.isReadOnly,
            );
          }
        }
      }
    };

    /**
     * The form is done rendering and has completed the attach phase.
     */
    const formRender = async (form: FormIOForm) => {
      context.emit("render", form);
    };

    const formLoaded = async (form: FormIOForm) => {
      showNav.value = true;
      // Emit formLoadedCallback event to the parent, so that parent can
      // perform the parent specific logic inside parent on
      // form is loaded
      context.emit("formLoadedCallback", form);
      formInstance = form;
      // Disable internal submit button.
      formioUtils.disableWizardButtons(formInstance);
      formInstance.options.buttonSettings.showSubmit = false;
      // Handle the navigation using the breadcrumbs.
      formInstance.on("wizardPageSelected", (page: any, index: number) => {
        isFirstPage.value = index === 0;
        isLastPage.value = formInstance.isLastPage();
        // Event to set isInFirstPage, current page and isInLastPage to parent
        context.emit(
          "pageChanged",
          isFirstPage.value,
          formInstance.page,
          isLastPage.value,
        );
      });
      // Handle the navigation using next/prev buttons.
      const prevNextNavigation = (navigation: WizardNavigationEvent) => {
        isFirstPage.value = navigation.page === 0;
        isLastPage.value = formInstance.isLastPage();
        // Event to set isInFirstPage, current page and isInLastPage to parent
        context.emit(
          "pageChanged",
          isFirstPage.value,
          formInstance.page,
          isLastPage.value,
        );
      };
      formInstance.on("prevPage", prevNextNavigation);
      formInstance.on("nextPage", prevNextNavigation);

      await loadFormDependencies();
    };

    const getOfferingDetails = async (form: FormIOForm, locationId: number) => {
      const educationProgramIdFromForm: number =
        formioUtils.getComponentValueByKey(form, PROGRAMS_DROPDOWN_KEY);
      if (educationProgramIdFromForm && offeringIntensity) {
        // when isReadOnly.value is true, then consider
        // both active and inactive program year.
        formioUtils.setComponentValue(form, OFFERINGS_DROPDOWN_KEY, "");
        await formioDataLoader.loadOfferingsForLocation(
          form,
          educationProgramIdFromForm,
          locationId,
          OFFERINGS_DROPDOWN_KEY,
          props.programYearId,
          offeringIntensity,
          props.isReadOnly,
        );
      }
    };

    const formChanged = async (form: FormIOForm, event: any) => {
      const locationId = +formioUtils.getComponentValueByKey(
        form,
        LOCATIONS_DROPDOWN_KEY,
      );
      if (event.changed?.component.key === LOCATIONS_DROPDOWN_KEY) {
        /*
        If `programnotListed` is already checked in the draft and
        when student edit the draft application and changes the
        location then `programnotListed` checkbox will reset/uncheck.
      */
        await formioUtils.resetCheckBox(form, PROGRAM_NOT_LISTED, {
          programnotListed: false,
        });
        const selectedLocationId = getSelectedId(form);

        if (selectedLocationId) {
          // when isReadOnly.value is true, then consider
          // both active and inactive program year.
          formioUtils.setComponentValue(form, PROGRAMS_DROPDOWN_KEY, "");
          await formioDataLoader.loadProgramsForLocation(
            form,
            +selectedLocationId,
            PROGRAMS_DROPDOWN_KEY,
            props.programYearId,
            props.isReadOnly,
          );
        }
      }
      if (event.changed?.component.key === PROGRAMS_DROPDOWN_KEY) {
        if (+event.changed.value > 0) {
          await formioComponentLoader.loadProgramDesc(
            form,
            +event.changed.value,
            SELECTED_PROGRAM_DESC_KEY,
          );
        }

        /*
        If `offeringnotListed` is already checked in the draft and
        when student edit the draft application and changes the
        offering intensity then `programnotListed` checkbox will reset/uncheck.
      */
        await formioUtils.resetCheckBox(form, OFFERING_NOT_LISTED, {
          offeringnotListed: false,
        });
        await getOfferingDetails(form, locationId);
      }
      if (
        event.changed?.component.key === OFFERINGS_DROPDOWN_KEY &&
        +event.changed.value > 0
      ) {
        await formioComponentLoader.loadSelectedOfferingDetails(
          form,
          +event.changed.value,
          SELECTED_OFFERING_START_DATE_KEY,
          SELECTED_OFFERING_END_DATE_KEY,
        );
      }
      // If the user after selecting a study period finds that
      // they need to check my study period not listed, then
      // the details of previously selected
      // study period must be cleared.
      if (
        event.changed?.component.key === OFFERING_NOT_LISTED &&
        event.changed.value?.offeringnotListed
      ) {
        resetSelectedOfferingDetails(form);
      }

      // If the user after selecting a study period finds that
      // they need to check my program not listed, then
      // the details of previously selected
      // study period must be cleared.
      if (
        event.changed?.component.key === PROGRAM_NOT_LISTED &&
        event.changed.value?.programnotListed
      ) {
        resetSelectedOfferingDetails(form);
      }
    };

    const resetSelectedOfferingDetails = (form: FormIOForm) => {
      formioUtils.setComponentValue(form, SELECTED_OFFERING_END_DATE_KEY, "");
      formioUtils.setComponentValue(form, SELECTED_OFFERING_START_DATE_KEY, "");
    };

    const wizardGoPrevious = () => {
      formInstance.prevPage();
    };

    const wizardGoNext = () => {
      formInstance.nextPage();
    };

    const submitted = (args: any, form: FormIOForm) => {
      context.emit("submitApplication", args, form);
    };

    const customEvent = (form: FormIOForm, event: FormIOCustomEvent) => {
      context.emit("customEventCallback", form, event);
    };

    watch(
      () => props.initialData,
      async () => {
        await loadFormDependencies();
      },
    );
    return {
      wizardGoNext,
      wizardGoPrevious,
      formChanged,
      formLoaded,
      formRender,
      isFirstPage,
      isLastPage,
      submitted,
      customEvent,
      showNav,
      isSaveDraftAllowed,
      formData,
    };
  },
});
</script>
