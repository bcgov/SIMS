<template>
  <full-page-container>
    <body-header
      title="Search for application"
      title-header-level="1"
      subTitle="To provide your supporting information, please search for the application
      by entering the requested information below. All fields are mandatory and
      must match exactly with the information provided on the student
      application."
    >
    </body-header>
    <v-form ref="searchApplicationsForm">
      <content-group class="mb-4">
        <v-row>
          <v-col>
            <v-text-field
              density="compact"
              label="Application number"
              variant="outlined"
              v-model="applicationNumber"
              data-cy="applicationNumber"
              :rules="[
                (v) => checkNullOrEmptyRule(v, 'Number'),
                (v) => checkOnlyDigitsRule(v, 'Number'),
              ]"
              hide-details="auto"
            />
          </v-col>
          <v-col>
            <v-text-field
              density="compact"
              label="Student's last name"
              variant="outlined"
              v-model="studentsLastName"
              data-cy="studentsLastName"
              :rules="[(v) => checkNullOrEmptyRule(v, 'Last name')]"
              hide-details="auto"
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
              :rules="[(v) => checkNullOrEmptyRule(v, 'Date of birth')]"
              hide-details="auto"
            />
          </v-col>
          <v-col
            ><v-btn color="primary" @click="applicationSearch"
              >Search</v-btn
            ></v-col
          >
        </v-row>
      </content-group>
    </v-form>
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
          >Back</v-btn
        >
      </v-col>
      <v-col>
        <v-btn
          class="float-right"
          color="primary"
          v-show="!isLastPage"
          @click="wizardGoNext"
          >Next step</v-btn
        >
        <v-btn
          class="float-right"
          :disabled="!isLastPage || submitting"
          v-show="!isFirstPage"
          color="primary"
          @click="wizardSubmit()"
          :loading="submitting"
        >
          {{ submitting ? "Submitting..." : "Submit form" }}
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
  useRules,
} from "@/composables";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import { PropType, ref, defineComponent } from "vue";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
  WizardNavigationEvent,
  SupportingUserType,
  FormIOForm,
  VForm,
  ApiProcessError,
  OfferingIntensity,
} from "@/types";
import { UpdateSupportingUserAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  props: {
    supportingUserType: {
      type: String as PropType<SupportingUserType>,
      required: true,
    },
  },
  setup(props) {
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
    const { disableWizardButtons, excludeExtraneousValues } = useFormioUtils();
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const showNav = ref(false);
    let formInstance: FormIOForm;
    const searchApplicationsForm = ref({} as VForm);
    const { checkOnlyDigitsRule, checkNullOrEmptyRule } = useRules();

    const wizardSubmit = () => {
      formInstance.submit();
    };

    const formLoaded = async (form: FormIOForm) => {
      showNav.value = true;
      formInstance = form;
      // Disable internal submit button.
      disableWizardButtons(formInstance);
      formInstance.options.buttonSettings.showSubmit = false;
      // Handle the navigation using the breadcrumbs.
      formInstance.on(
        "wizardPageSelected",
        (_page: WizardNavigationEvent, index: number) => {
          isFirstPage.value = index === 0;
          isLastPage.value = formInstance.isLastPage();
        },
      );
      // Handle the navigation using next/prev buttons.
      const prevNextNavigation = (navigation: WizardNavigationEvent) => {
        isFirstPage.value = navigation.page === 0;
        isLastPage.value = formInstance.isLastPage();
      };
      formInstance.on("prevPage", prevNextNavigation);
      formInstance.on("nextPage", prevNextNavigation);
    };

    const setInitialData = (
      programYearStartDate: string,
      offeringIntensity: OfferingIntensity,
    ) => {
      initialData.value = {
        givenNames: bcscParsedToken.givenNames,
        lastName: bcscParsedToken.lastName,
        email: bcscParsedToken.email,
        gender: bcscParsedToken.gender,
        dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
        programYearStartDate,
        offeringIntensity,
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
      showNav.value = false;
      const validationResult = await searchApplicationsForm.value.validate();
      if (!validationResult.valid) {
        return;
      }

      try {
        const searchResult =
          await SupportingUsersService.shared.getApplicationDetails(
            props.supportingUserType,
            getIdentifiedApplication(),
          );
        setInitialData(
          searchResult.programYearStartDate,
          searchResult.offeringIntensity,
        );
        formName.value = searchResult.formName;
      } catch (error: unknown) {
        formName.value = null;
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case STUDENT_APPLICATION_NOT_FOUND:
              snackBar.warn(`Application not found. ${error.message}`);
              break;
            case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
              snackBar.error(
                `The student cannot act as a supporting user for its own application.
                ${error.message}`,
                snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
              );
              break;
          }
        } else {
          snackBar.error(
            "An unexpected error happened while searching for the application.",
          );
        }
      }
    };

    const submitted = async (formData: unknown) => {
      submitting.value = true;
      try {
        const typedData = excludeExtraneousValues(
          UpdateSupportingUserAPIInDTO,
          formData,
        );
        await SupportingUsersService.shared.updateSupportingInformation(
          props.supportingUserType,
          { ...typedData, ...getIdentifiedApplication() },
        );

        snackBar.success("Supporting data submitted with success.");
        router.push({ name: SupportingUserRoutesConst.DASHBOARD });
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case STUDENT_APPLICATION_NOT_FOUND:
              snackBar.error(
                error.message,
                snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
              );
              break;
            case SUPPORTING_USER_ALREADY_PROVIDED_DATA:
              snackBar.warn(
                `User already provided data.
                ${error.message}`,
                snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
              );
              break;
            case SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA:
              snackBar.warn(
                `Not expecting data for a ${props.supportingUserType}.
                ${error.message}`,
                snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
              );
              break;
            case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
              snackBar.error(
                `The student cannot act as a supporting user for its own application. ${error.message}`,
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
        } else {
          snackBar.error(
            "An unexpected error happened while submitting supporting data.",
          );
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
      checkOnlyDigitsRule,
      checkNullOrEmptyRule,
      searchApplicationsForm,
    };
  },
});
</script>
