<template>
  <formio
    :formName="selectedForm"
    :data="initialData"
    :readOnly="isReadOnly"
    @loaded="formLoaded"
    @changed="formChanged"
    @submitted="submitted"
    @customEvent="customEvent"
  ></formio>
  <v-row v-if="!!showNav">
    <v-col md="6">
      <v-btn
        color="primary"
        v-show="!isFirstPage"
        outlined
        @click="wizardGoPrevious"
        >Previous section</v-btn
      >
    </v-col>
    <v-col md="6" class="ml-auto text-right">
      <v-btn color="primary" v-show="!isLastPage" @click="wizardGoNext"
        >Next section</v-btn
      >
    </v-col>
  </v-row>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import {
  OfferingIntensity,
  WizardNavigationEvent,
  FormIOCustomEvent,
} from "@/types";
import { ref, SetupContext, watch } from "vue";
import {
  useFormioComponentLoader,
  useFormioDropdownLoader,
  useFormioUtils,
} from "@/composables";

export default {
  emits: [
    "formLoadedCallback",
    "submitApplication",
    "customEventCallback",
    "pageChanged",
  ],
  components: {
    formio,
  },
  props: {
    initialData: {
      type: Object,
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
  },
  setup(props: any, context: SetupContext) {
    // Component's names on Form.IO definition that will be manipulated.
    const LOCATIONS_DROPDOWN_KEY = "selectedLocation";
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const SELECTED_OFFERING_DATE_KEY = "selectedOfferingDate";
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

    const getSelectedId = (form: any) => {
      return formioUtils.getComponentValueByKey(form, LOCATIONS_DROPDOWN_KEY);
    };

    const loadFormDependencies = async () => {
      if (!props.isReadOnly && !!formInstance) {
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
        const selectedIntensity: OfferingIntensity = formioUtils.getComponentValueByKey(
          formInstance,
          OFFERING_INTENSITY_KEY,
        );
        if (selectedProgramId && selectedIntensity) {
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
            selectedIntensity,
            props.isReadOnly,
          );
        }
      }
    };
    const formLoaded = async (form: any) => {
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
      loadFormDependencies();
    };

    const getOfferingDetails = async (form: any, locationId: number) => {
      const selectedIntensity: OfferingIntensity = formioUtils.getComponentValueByKey(
        form,
        OFFERING_INTENSITY_KEY,
      );
      const educationProgramIdFromForm: number = formioUtils.getComponentValueByKey(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );
      if (educationProgramIdFromForm && selectedIntensity) {
        // when isReadOnly.value is true, then consider
        // both active and inactive program year.
        await formioDataLoader.loadOfferingsForLocation(
          form,
          educationProgramIdFromForm,
          locationId,
          OFFERINGS_DROPDOWN_KEY,
          props.programYearId,
          selectedIntensity,
          props.isReadOnly,
        );
      }
    };

    const formChanged = async (form: any, event: any) => {
      const locationId = +formioUtils.getComponentValueByKey(
        form,
        LOCATIONS_DROPDOWN_KEY,
      );
      if (
        event.changed?.component.key === LOCATIONS_DROPDOWN_KEY ||
        event.changed?.component.key === OFFERING_INTENSITY_KEY
      ) {
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
        getOfferingDetails(form, locationId);
      }
      if (
        event.changed?.component.key === OFFERINGS_DROPDOWN_KEY &&
        +event.changed.value > 0
      ) {
        await formioComponentLoader.loadSelectedOfferingDate(
          form,
          +event.changed.value,
          SELECTED_OFFERING_DATE_KEY,
        );
      }
    };

    const wizardGoPrevious = () => {
      formInstance.prevPage();
    };

    const wizardGoNext = () => {
      formInstance.nextPage();
    };

    const submitted = (args: any, form: any) => {
      context.emit("submitApplication", args, form);
    };

    const customEvent = (form: any, event: FormIOCustomEvent) => {
      context.emit("customEventCallback", form, event);
    };

    watch(
      () => props.initialData,
      () => {
        loadFormDependencies();
      },
    );
    return {
      wizardGoNext,
      wizardGoPrevious,
      formChanged,
      formLoaded,
      isFirstPage,
      isLastPage,
      submitted,
      customEvent,
      showNav,
    };
  },
};
</script>
