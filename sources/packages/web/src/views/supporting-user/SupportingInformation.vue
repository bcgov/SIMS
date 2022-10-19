<template>
  <full-page-container>
    <content-group class="mb-4">
      <p class="category-header-large primary-color">Search for application</p>
      <p>
        To provide your supporting information, please search for the
        application by entering the requested information below. All fields are
        mandatory and must match exactly with the information provided on the
        student application.
      </p>
      <v-row>
        <v-col>
          <v-text-field
            density="compact"
            label="Application number"
            variant="outlined"
            v-model="applicationNumber"
            data-cy="applicationNumber"
            type="number"
            :rules="[(v) => /\d+/.test(v) || 'Invalid application number']"
          />
        </v-col>
        <v-col>
          <v-text-field
            density="compact"
            label="Student's last name"
            variant="outlined"
            v-model="studentsLastName"
            data-cy="studentsLastName"
            :rules="[(v) => !!v || 'Student\'s last name required']"
          />
        </v-col>
        <v-col>
          <v-text-field
            density="compact"
            label="Student's date of birth"
            variant="outlined"
            v-model="studentsDateOfBirth"
            data-cy="studentsDateOfBirth"
            type="date"
            :rules="[(v) => !!v || 'Student\'s date of birth required']"
          />
        </v-col>
        <v-col
          ><v-btn color="primary" @click="applicationSearch"
            >Search</v-btn
          ></v-col
        >
      </v-row>
    </content-group>
    <formio
      v-if="formName"
      :formName="formName"
      :data="initialData"
      :readOnly="submitting"
      @submitted="submitted"
      @loaded="formLoaded"
    ></formio>
    <v-row v-if="showNav">
      <v-col>
        <v-btn
          color="primary"
          v-show="!isFirstPage"
          variant="outlined"
          data-cy="previousSection"
          @click="wizardGoPrevious"
          >Previous section</v-btn
        >
      </v-col>
      <v-col>
        <v-btn
          class="float-right"
          color="primary"
          v-show="!isLastPage"
          @click="wizardGoNext"
          >Next section</v-btn
        >
        <v-btn
          class="float-right"
          :disabled="!isLastPage || submitting"
          v-show="!isFirstPage"
          color="primary"
          @click="wizardSubmit()"
        >
          <v-progress-circular
            v-if="submitting"
            class="mr-3"
            bg-color="white"
            indeterminate
            color="secondary"
            size="23"
          />
          {{ submitting ? "Submitting..." : "Submit application" }}
        </v-btn>
      </v-col>
    </v-row>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import {
  useAuthBCSC,
  useFormatters,
  useSnackBar,
  useFormioUtils,
} from "@/composables";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import { ref, SetupContext } from "vue";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
  WizardNavigationEvent,
} from "@/types";

export default {
  props: {
    supportingUserType: {
      type: String,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const { bcscParsedToken } = useAuthBCSC();
    const submitting = ref(false);
    const formName = ref();
    const applicationNumber = ref("");
    const studentsLastName = ref("");
    const studentsDateOfBirth = ref();
    const initialData = ref();
    const formioUtils = useFormioUtils();
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const showNav = ref(false);
    let formInstance: any;

    const wizardSubmit = () => {
      formInstance.submit();
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
    };

    const setInitialData = (programYearStartDate: Date) => {
      initialData.value = {
        givenNames: bcscParsedToken.givenNames,
        lastName: bcscParsedToken.lastName,
        email: bcscParsedToken.email,
        gender: bcscParsedToken.gender,
        dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
        programYearStartDate,
      };
    };

    /**
     * The 3 pieces of information necessary to identify a Student application.
     * Used for search the application and submit supporting information.
     */
    const getIdentifiedApplication = () => ({
      applicationNumber: applicationNumber.value,
      studentsLastName: studentsLastName.value,
      studentsDateOfBirth: studentsDateOfBirth.value,
    });

    const applicationSearch = async () => {
      if (
        !applicationNumber.value ||
        !studentsLastName.value ||
        !studentsDateOfBirth.value
      ) {
        snackBar.warn("Please complete all the mandatory fields.");
        return;
      }

      if (isNaN(Date.parse(studentsDateOfBirth.value))) {
        snackBar.warn("Please check the Student's Date Of Birth.");
        return;
      }

      try {
        const searchResult =
          await SupportingUsersService.shared.getApplicationDetails(
            props.supportingUserType,
            getIdentifiedApplication(),
          );
        setInitialData(searchResult.programYearStartDate);
        formName.value = searchResult.formName;
      } catch (error) {
        formName.value = null;
        switch (error.response.data.errorType) {
          case STUDENT_APPLICATION_NOT_FOUND:
            snackBar.warn(
              `Application not found. ${error.response.data.message}`,
            );
            break;
          case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
            snackBar.error(
              `The student cannot act as a supporting user for its own application.
              ${error.response.data.message}`,
              snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
        }
      }
    };

    const submitted = async (formData: any) => {
      submitting.value = true;
      try {
        await SupportingUsersService.shared.updateSupportingInformation(
          props.supportingUserType,
          { ...formData, ...getIdentifiedApplication() },
        );

        snackBar.success("Supporting data submitted with success.");
        router.push({ name: SupportingUserRoutesConst.DASHBOARD });
      } catch (error) {
        switch (error.response.data.errorType) {
          case STUDENT_APPLICATION_NOT_FOUND:
            snackBar.error(
              error.response.data.message,
              snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
          case SUPPORTING_USER_ALREADY_PROVIDED_DATA:
            snackBar.warn(
              `User already provided data.
              ${error.response.data.message}`,
              snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
          case SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA:
            snackBar.warn(
              `Not expecting data for a ${props.supportingUserType}.
              ${error.response.data.message}`,
              snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
          case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
            snackBar.error(
              `The student cannot act as a supporting user for its own application. ${error.response.data.message}`,
              snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
          default:
            snackBar.error(
              "Unexpected error while submitting the supporting data.",
              snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
        }
      } finally {
        submitting.value = false;
      }
    };

    const wizardGoPrevious = () => {
      formInstance.prevPage();
    };

    const wizardGoNext = () => {
      formInstance.nextPage();
    };

    return {
      formName,
      initialData,
      submitted,
      submitting,
      applicationNumber,
      studentsDateOfBirth,
      studentsLastName,
      applicationSearch,
      wizardGoNext,
      wizardGoPrevious,
      wizardSubmit,
      formLoaded,
      isFirstPage,
      isLastPage,
      showNav,
    };
  },
};
</script>
