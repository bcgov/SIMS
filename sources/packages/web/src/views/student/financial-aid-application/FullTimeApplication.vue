<template>
  <RestrictionBanner
    v-if="hasRestriction"
    :restrictionMessage="restrictionMessage"
  />
  <full-page-container>
    <v-row class="center-container application-container mb-5 text-right">
      <v-col md="12" class="ml-auto">
        <v-btn
          color="primary"
          class="mr-5"
          v-if="!notDraft && !hasRestriction"
          v-show="!isFirstPage && !submittingApplication"
          text
          :loading="savingDraft"
          @click="saveDraft()"
        >
          <v-icon left :size="25"> mdi-pencil </v-icon
          >{{ savingDraft ? "Saving..." : "Save draft" }}</v-btn
        >
        <v-btn
          v-if="!isReadOnly && !hasRestriction"
          :disabled="!isLastPage || submittingApplication"
          v-show="!isFirstPage"
          color="primary"
          @click="wizardSubmit()"
          >{{ submittingApplication ? "Submitting..." : "Submit application" }}
          <span v-if="submittingApplication">
            &nbsp;&nbsp;
            <ProgressSpinner
              style="width: 30px; height: 25px"
              strokeWidth="10"/></span
        ></v-btn>
      </v-col>
    </v-row>
    <formio
      :formName="selectedForm"
      :data="initialData"
      :readOnly="isReadOnly"
      @loaded="formLoaded"
      @changed="formChanged"
      @submitted="submitApplication"
      @customEvent="customEventCallback"
    ></formio>
    <v-row>
      <v-col md="6">
        <v-btn
          color="primary"
          v-show="!isFirstPage"
          outlined
          @click="wizardGoPrevious()"
          >Previous section</v-btn
        >
      </v-col>
      <v-col md="6" class="ml-auto text-right">
        <v-btn color="primary" v-show="!isLastPage" @click="wizardGoNext()"
          >Next section</v-btn
        >
      </v-col>
    </v-row>
  </full-page-container>
  <ConfirmEditApplication
    ref="editApplicationModal"
    @confirmEditApplication="editApplicaion"
  />
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import formio from "@/components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { StudentService } from "@/services/StudentService";
import { ApplicationService } from "@/services/ApplicationService";
import {
  useFormioDropdownLoader,
  useFormioUtils,
  useToastMessage,
  useFormioComponentLoader,
  ModalDialog,
} from "@/composables";
import {
  WizardNavigationEvent,
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  ApplicationStatus,
  OfferingIntensity,
  GetApplicationDataDto,
} from "@/types";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import {
  INVALID_STUDY_DATES,
  OFFERING_START_DATE_ERROR,
} from "@/views/institution/locations/program-info-request/LocationEditProgramInfoRequest.vue";

export default {
  components: {
    formio,
    ConfirmEditApplication,
    RestrictionBanner,
    FullPageContainer,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
    selectedForm: {
      type: String,
      required: true,
    },
    readOnly: {
      type: String,
    },
    programYearId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const formioComponentLoader = useFormioComponentLoader();
    const toast = useToastMessage();
    const savingDraft = ref(false);
    const submittingApplication = ref(false);
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    let applicationWizard: any;
    const isReadOnly = ref(false);
    const notDraft = ref(false);
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const existingApplication = ref({} as GetApplicationDataDto);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const TOAST_ERROR_DISPLAY_TIME = 15000;

    const checkProgramYear = async () => {
      // check program year, if not active allow only readonly mode with a toast
      const programYearDetails = await ApplicationService.shared.getProgramYearOfApplication(
        props.id,
        true,
      );
      if (!programYearDetails.active) {
        isReadOnly.value = true;
        toast.error(
          "Program Year not active",
          "This application can no longer be edited or submitted",
          TOAST_ERROR_DISPLAY_TIME,
        );
      }
    };
    onMounted(async () => {
      //Get the student information, application information and student restriction.
      const [
        studentInfo,
        applicationData,
        studentRestriction,
      ] = await Promise.all([
        StudentService.shared.getStudentInfo(),
        ApplicationService.shared.getApplicationData(props.id),
        StudentService.shared.getStudentRestriction(),
      ]);
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
      // Adjust the spaces when optional fields are not present.
      isReadOnly.value =
        [
          ApplicationStatus.completed,
          ApplicationStatus.cancelled,
          ApplicationStatus.overwritten,
        ].includes(applicationData.applicationStatus) || !!props.readOnly;

      notDraft.value =
        !!props.readOnly ||
        ![ApplicationStatus.draft].includes(applicationData.applicationStatus);

      const address = studentInfo.contact;
      // TODO: Move formatted address to a common place in Vue app or API.
      const formattedAddress = `${address.addressLine1} ${address.addressLine2} ${address.city} ${address.provinceState} ${address.postalCode}  ${address.country}`;
      const studentFormData = {
        studentGivenNames: studentInfo.firstName,
        studentLastName: studentInfo.lastName,
        studentGender: studentInfo.gender,
        studentDateOfBirth: studentInfo.birthDateFormatted,
        studentPhoneNumber: studentInfo.contact.phone,
        studentHomeAddress: formattedAddress,
        studentEmail: studentInfo.email,
        pdStatus: studentInfo.pdStatus,
      };
      initialData.value = { ...applicationData.data, ...studentFormData };
      existingApplication.value = applicationData;
    });

    // Save the current state of the student application skipping all validations.
    const saveDraft = async () => {
      savingDraft.value = true;
      try {
        const associatedFiles = formioUtils.getAssociatedFiles(
          applicationWizard,
        );
        await ApplicationService.shared.saveApplicationDraft(props.id, {
          programYearId: props.programYearId,
          data: applicationWizard.submission.data,
          associatedFiles,
        });
        toast.success("Draft saved!", "Application draft saved with success.");
      } catch (error) {
        toast.error("Unexpected error!", "An unexpected error happen.");
      } finally {
        savingDraft.value = false;
      }
    };

    // Execute the final submission of the student application.
    const submitApplication = async (args: any, form: any) => {
      submittingApplication.value = true;
      try {
        const associatedFiles = formioUtils.getAssociatedFiles(form);
        await ApplicationService.shared.submitApplication(props.id, {
          programYearId: props.programYearId,
          data: args,
          associatedFiles,
        });
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        });
        toast.success(
          "Application saved!",
          "Thank you, your application has been submitted.",
        );
      } catch (error) {
        const errorLabel = "Unexpected error!";
        let errorMsg = "An unexpected error happen.";
        [INVALID_STUDY_DATES, OFFERING_START_DATE_ERROR].forEach(
          customError => {
            if (error.includes(customError)) {
              errorMsg = error.replace(customError, "").trim();
            }
          },
        );
        toast.error(errorLabel, errorMsg);
      } finally {
        submittingApplication.value = false;
      }
    };

    // Components names on Form.IO definition that will be manipulated.
    const LOCATIONS_DROPDOWN_KEY = "selectedLocation";
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const SELECTED_OFFERING_DATE_KEY = "selectedOfferingDate";
    const SELECTED_PROGRAM_DESC_KEY = "selectedProgramDesc";
    const OFFERING_INTENSITY_KEY = "howWillYouBeAttendingTheProgram";
    const PROGRAM_NOT_LISTED = "myProgramNotListed";
    const OFFERING_NOT_LISTED = "myStudyPeriodIsntListed";

    const formLoaded = async (form: any) => {
      applicationWizard = form;
      await checkProgramYear();
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

      await formioDataLoader.loadLocations(form, LOCATIONS_DROPDOWN_KEY);
      const selectedLocationId = formioUtils.getComponentValueByKey(
        form,
        LOCATIONS_DROPDOWN_KEY,
      );

      if (selectedLocationId) {
        // when isReadOnly.value is true, then consider
        // both active and inactive program year.
        await formioDataLoader.loadProgramsForLocation(
          form,
          +selectedLocationId,
          PROGRAMS_DROPDOWN_KEY,
          props.programYearId,
          isReadOnly.value,
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
          props.programYearId,
          selectedIntensity,
          isReadOnly.value,
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

      // when isReadOnly.value is true, then consider
      // both active and inactive program year.
      await formioDataLoader.loadOfferingsForLocation(
        form,
        educationProgramIdFromForm,
        locationId,
        OFFERINGS_DROPDOWN_KEY,
        props.programYearId,
        selectedIntensity,
        isReadOnly.value,
      );
    };

    const formChanged = async (form: any, event: any) => {
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

        // when isReadOnly.value is true, then consider
        // both active and inactive program year.
        await formioDataLoader.loadProgramsForLocation(
          form,
          +event.changed.value,
          PROGRAMS_DROPDOWN_KEY,
          props.programYearId,
          isReadOnly.value,
        );
      }
      if (event.changed.component.key === PROGRAMS_DROPDOWN_KEY) {
        if (+event.changed.value > 0) {
          await formioComponentLoader.loadProgramDesc(
            form,
            +event.changed.value,
            SELECTED_PROGRAM_DESC_KEY,
          );
        }
      }
      if (event.changed.component.key === OFFERING_INTENSITY_KEY) {
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

    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      if (FormIOCustomEventTypes.RouteToStudentProfile === event.type) {
        router.push({
          name: StudentRoutesConst.STUDENT_PROFILE_EDIT,
        });
      }
    };

    const wizardGoPrevious = () => {
      applicationWizard.prevPage();
    };

    const wizardGoNext = () => {
      applicationWizard.nextPage();
    };

    const editApplicaion = () => {
      applicationWizard.submit();
    };

    const confirmEditApplication = async () => {
      if (await editApplicationModal.value.showModal()) {
        editApplicaion();
      }
    };

    const wizardSubmit = () => {
      if (
        existingApplication.value.applicationStatus !== ApplicationStatus.draft
      ) {
        confirmEditApplication();
      } else {
        applicationWizard.submit();
      }
    };
    return {
      initialData,
      formLoaded,
      formChanged,
      wizardGoPrevious,
      wizardGoNext,
      wizardSubmit,
      isFirstPage,
      isLastPage,
      saveDraft,
      submitApplication,
      savingDraft,
      submittingApplication,
      customEventCallback,
      isReadOnly,
      notDraft,
      confirmEditApplication,
      editApplicaion,
      editApplicationModal,
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>

<style lang="scss">
.fa-app-header {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 27px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 4px 0px;
}
.fa-app-header-1 {
  @extend .fa-app-header;
  color: #485363;
  opacity: 0.5;
}
.fa-app-header-2 {
  @extend .fa-app-header;
  top: 31px;
  letter-spacing: -0.2px;
  color: #485363;
}
.fa-app-header-3 {
  @extend .fa-app-header;
  color: #2965c5;
  line-height: 34px;
}
.img-background {
  background-image: url("../../../assets/images/icon_assistance.svg");
  background-repeat: no-repeat;
  background-size: contain;
  width: 100%;
  height: 100%;
  min-height: 350px;
}
</style>
