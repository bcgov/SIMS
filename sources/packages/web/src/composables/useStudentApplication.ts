import { OfferingIntensity, WizardNavigationEvent } from "@/types";
import { ref } from "vue";
import {
  useFormioComponentLoader,
  useFormioDropdownLoader,
  useFormioUtils,
} from "@/composables";

export function useStudentApplication(
  isReadOnly: boolean,
  programYearId: number,
) {
  // Components names on Form.IO definition that will be manipulated.
  const LOCATIONS_DROPDOWN_KEY = "selectedLocation";
  const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
  const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
  const SELECTED_OFFERING_DATE_KEY = "selectedOfferingDate";
  const SELECTED_PROGRAM_DESC_KEY = "selectedProgramDesc";
  const OFFERING_INTENSITY_KEY = "howWillYouBeAttendingTheProgram";
  const PROGRAM_NOT_LISTED = "myProgramNotListed";
  const OFFERING_NOT_LISTED = "myStudyPeriodIsntListed";

  let applicationWizard: any;
  const formioUtils = useFormioUtils();
  const formioDataLoader = useFormioDropdownLoader();
  const formioComponentLoader = useFormioComponentLoader();

  const isFirstPage = ref(true);
  const isLastPage = ref(false);

  const getSelectedId = (form: any) => {
    return formioUtils.getComponentValueByKey(form, LOCATIONS_DROPDOWN_KEY);
  };

  const formLoaded = async (form: any) => {
    applicationWizard = form;
    // Disable internal submit button.
    formioUtils.disableWizardButtons(applicationWizard);
    applicationWizard.options.buttonSettings.showSubmit = false;
    // Handle the navigation using the breadcrumbs.
    applicationWizard.on("wizardPageSelected", (page: any, index: number) => {
      isFirstPage.value = index === 0;
      isLastPage.value = applicationWizard.isLastPage();
    });
    // Handle the navigation using next/prev buttons.
    const prevNextNavigation = (navigation: WizardNavigationEvent) => {
      isFirstPage.value = navigation.page === 0;
      isLastPage.value = applicationWizard.isLastPage();
    };
    applicationWizard.on("prevPage", prevNextNavigation);
    applicationWizard.on("nextPage", prevNextNavigation);
    // todo:ann below code is not there in AEST- check
    await formioDataLoader.loadLocations(form, LOCATIONS_DROPDOWN_KEY);
    const selectedLocationId = getSelectedId(form);

    if (selectedLocationId) {
      // when isReadOnly.value is true, then consider
      // both active and inactive program year.
      await formioDataLoader.loadProgramsForLocation(
        form,
        +selectedLocationId,
        PROGRAMS_DROPDOWN_KEY,
        programYearId,
        isReadOnly,
      );
    }

    const selectedProgramId = formioUtils.getComponentValueByKey(
      form,
      PROGRAMS_DROPDOWN_KEY,
    );
    const selectedIntensity: OfferingIntensity = formioUtils.getComponentValueByKey(
      form,
      OFFERING_INTENSITY_KEY,
    );
    if (selectedProgramId && selectedIntensity) {
      await formioComponentLoader.loadProgramDesc(
        form,
        selectedProgramId,
        SELECTED_PROGRAM_DESC_KEY,
      );
      // when isReadOnly.value is true, then consider
      // both active and inactive program year.
      await formioDataLoader.loadOfferingsForLocation(
        form,
        selectedProgramId,
        selectedLocationId,
        OFFERINGS_DROPDOWN_KEY,
        programYearId,
        selectedIntensity,
        isReadOnly,
      );
    }
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
        programYearId,
        selectedIntensity,
        isReadOnly,
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
          programYearId,
          isReadOnly,
        );
      }
    }
    if (event.changed.component.key === PROGRAMS_DROPDOWN_KEY) {
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
      event.changed.component.key === OFFERINGS_DROPDOWN_KEY &&
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
    applicationWizard.prevPage();
  };

  const wizardGoNext = () => {
    applicationWizard.nextPage();
  };
  return {
    getSelectedId,
    formLoaded,
    formChanged,
    wizardGoPrevious,
    wizardGoNext,
    applicationWizard,
  };
}
