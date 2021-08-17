<template>
  <v-container class="center-container application-container">
    <div class="p-card p-m-4 w-100">
      <div class="p-p-4">
        <v-row class="center-container application-container mb-5 text-right">
          <v-col md="12" class="ml-auto ">
            <v-btn
              color="primary"
              class="mr-5"
              v-show="!isFirstPage"
              text
              :loading="savingDraft"
              @click="saveDraft()"
            >
              <v-icon left :size="25"> mdi-pencil </v-icon
              >{{ savingDraft ? "Saving..." : "Save draft" }}</v-btn
            >
            <v-btn
              :disabled="!isLastPage || submittingApplication"
              v-show="!isFirstPage"
              color="primary"
              @click="wizardSubmit()"
              >{{
                submittingApplication ? "Submitting..." : "Submit application"
              }}</v-btn
            >
          </v-col>
        </v-row>
        <formio
          :formName="selectedForm"
          :data="initialData"
          @loaded="formLoaded"
          @changed="formChanged"
          @submitted="submitApplication"
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
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import formio from "../../../components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { StudentService } from "../../../services/StudentService";
import {
  useFormioDropdownLoader,
  useFormioUtils,
  useToastMessage,
} from "../../../composables";
import { ApplicationService } from "@/services/ApplicationService";

export default {
  components: {
    formio,
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
    programYearId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const toast = useToastMessage();
    const savingDraft = ref(false);
    const submittingApplication = ref(false);
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    let applicationWizard: any;

    onMounted(async () => {
      //Get the student information and application information.
      const [studentInfo, applicationData] = await Promise.all([
        StudentService.shared.getStudentInfo(),
        ApplicationService.shared.getApplicationData(props.id),
      ]);
      // TODO: Move formatted address to a common place in Vue app or API.
      // Adjust the spaces when optional fields are not present.
      const address = studentInfo.contact;
      const formattedAddress = `${address.addressLine1} ${address.addressLine2} ${address.city} ${address.provinceState} ${address.postalCode}  ${address.country}`;
      const studentFormData = {
        studentGivenNames: studentInfo.firstName,
        studentLastName: studentInfo.lastName,
        studentGender: studentInfo.gender,
        studentDateOfBirth: studentInfo.birthDateFormatted,
        studentPhoneNumber: studentInfo.contact.phone,
        studentHomeAddress: formattedAddress,
        studentEmail: studentInfo.email,
      };
      initialData.value = { ...studentFormData, ...applicationData };
    });

    // Save the current state of the student application skipping all validations.
    const saveDraft = async () => {
      savingDraft.value = true;
      try {
        const associatedFiles = formioUtils.getAssociatedFiles(
          applicationWizard,
        );
        await ApplicationService.shared.saveApplicationDraft(props.id, {
          data: applicationWizard.submission.data,
          programYearId: props.programYearId,
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
          data: args,
          associatedFiles,
        });
        toast.success(
          "Application saved!",
          "Application submitted with success.",
        );
      } catch (error) {
        toast.error("Unexpected error!", "An unexpected error happen.");
      } finally {
        submittingApplication.value = false;
      }
    };

    // Components names on Form.IO definition that will be manipulated.
    const LOCATIONS_DROPDOWN_KEY = "selectedLocation";
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const SELECTED_OFFERING_DATE_KEY = "selectedOfferingDate";
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
      const prevNextNavigation = (navigation: any) => {
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
        await formioDataLoader.loadProgramsForLocation(
          form,
          +selectedLocationId,
          PROGRAMS_DROPDOWN_KEY,
        );
      }

      const selectedProgramId = formioUtils.getComponentValueByKey(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );
      if (selectedProgramId) {
        await formioDataLoader.loadOfferingsForLocation(
          form,
          selectedProgramId,
          selectedLocationId,
          OFFERINGS_DROPDOWN_KEY,
        );
      }
    };

    const formChanged = async (form: any, event: any) => {
      if (event.changed?.component.key === LOCATIONS_DROPDOWN_KEY) {
        await formioDataLoader.loadProgramsForLocation(
          form,
          +event.changed.value,
          PROGRAMS_DROPDOWN_KEY,
        );
      }

      if (event.changed.component.key === PROGRAMS_DROPDOWN_KEY) {
        const locationId = +formioUtils.getComponentValueByKey(
          form,
          LOCATIONS_DROPDOWN_KEY,
        );
        await formioDataLoader.loadOfferingsForLocation(
          form,
          +event.changed.value,
          locationId,
          OFFERINGS_DROPDOWN_KEY,
        );
      }
      if (event.changed.component.key === OFFERINGS_DROPDOWN_KEY) {
        await formioDataLoader.loadSelectedOfferingDate(
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

    const wizardSubmit = () => {
      applicationWizard.submit();
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

.center-container {
  display: flex;
  justify-content: center;
}

.application-container {
  max-width: 1400px;
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
