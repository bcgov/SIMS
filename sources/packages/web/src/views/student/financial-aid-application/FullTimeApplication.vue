<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator
        title="Applications"
        :sub-title="
          changeRequest ? 'Change request' : 'Financial Aid Application'
        "
      >
        <template #buttons>
          <v-btn
            color="primary"
            v-if="!notDraft && !isFirstPage && !submittingApplication"
            variant="outlined"
            :loading="savingDraft"
            @click="saveDraft()"
          >
            {{ savingDraft ? "Saving..." : "Save draft" }}</v-btn
          >
          <v-btn
            v-if="!isReadOnly && isLastPage"
            class="ml-2"
            :disabled="submittingApplication"
            color="primary"
            @click="wizardSubmit()"
            :loading="submittingApplication"
          >
            {{ submittingApplication ? "Submitting..." : "Submit application" }}
          </v-btn>
        </template>
      </header-navigator>
    </template>
    <StudentApplication
      :selectedForm="selectedForm"
      :initialData="initialData"
      :isReadOnly="isReadOnly"
      :programYearId="programYearId"
      @formLoadedCallback="loadForm"
      @submitApplication="submitApplication"
      @customEventCallback="customEventCallback"
      @pageChanged="pageChanged"
      @wizardSubmit="wizardSubmit"
      @saveDraft="saveDraft"
      :processing="submittingApplication"
      :savingDraft="savingDraft"
      :notDraft="notDraft"
      :is-data-ready="isDataReady"
    />
  </student-page-container>
  <confirm-modal
    title="Edit application"
    ref="editApplicationModal"
    okLabel="Submit"
    cancelLabel="No"
    :disable-primary-button="!conditionsAccepted"
    ><template #content>
      <v-checkbox
        class="mt-2"
        color="primary"
        v-model="conditionsAccepted"
        :hide-details="true"
      >
        <template #label>
          <template v-if="changeRequest"
            >I acknowledge that by editing my application, I may be required to
            resubmit previously approved exception requests and my parent or
            partner may be required to resubmit supporting
            information.</template
          >
          <template v-else
            >I acknowledge that by editing my application, I may be required to
            resubmit previously approved exception requests. My institution may
            be required to resubmit program information, and my parent or
            partner may be required to resubmit supporting
            information.</template
          >
        </template>
      </v-checkbox>
      <banner
        v-if="isStudyEndDateWithinDeadline"
        :type="BannerTypes.Warning"
        class="mt-4"
      >
        <template #content
          >Please note your application has now passed the six week deadline for
          completed applications to be received by StudentAid BC. All edits to
          your application will require additional review from StudentAid BC to
          be considered for funding. Please see the following link for
          information on the
          <a
            rel="noopener"
            target="_blank"
            href="https://studentaidbc.ca/sites/all/files/form-library/appeal_fundingafterenddate.pdf"
            >funding after end date appeal</a
          >.
        </template>
      </banner>
    </template></confirm-modal
  >
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { ApplicationService } from "@/services/ApplicationService";
import {
  useFormioUtils,
  useSnackBar,
  ModalDialog,
  useFormatters,
} from "@/composables";
import {
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  ApplicationStatus,
  ApiProcessError,
  BannerTypes,
  FormIOForm,
  StudentApplicationFormData,
} from "@/types";
import { ApplicationDataAPIOutDTO } from "@/services/http/dto";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import {
  STUDY_DATE_OVERLAP_ERROR,
  ACTIVE_STUDENT_RESTRICTION,
  APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS,
} from "@/constants";
import StudentApplication from "@/components/common/StudentApplication.vue";
import { AppConfigService } from "@/services/AppConfigService";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";

export default defineComponent({
  components: {
    StudentApplication,
    ConfirmModal,
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
    changeRequest: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  setup(props) {
    const {
      genderDisplayFormat,
      getFormattedAddress,
      disabilityStatusToDisplay,
    } = useFormatters();

    const router = useRouter();
    const initialData = ref({} as StudentApplicationFormData);
    const isStudyEndDateWithinDeadline = ref(true);
    const formioUtils = useFormioUtils();
    const snackBar = useSnackBar();
    const savingDraft = ref(false);
    const submittingApplication = ref(false);
    let applicationWizard: any;
    let savedDraftData: string;
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const isReadOnly = ref(!!props.readOnly);
    const notDraft = ref(false);
    const existingApplication = ref({} as ApplicationDataAPIOutDTO);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const conditionsAccepted = ref(false);
    // automaticDraftSaveInProgress is a boolean that ensures that multiple api calls for save
    // draft are not made while a draft save is in progress.
    let automaticDraftSaveInProgress = false;
    const isDataReady = ref(false);

    const checkProgramYear = async () => {
      // check program year, if not active allow only readonly mode with a snackBar
      const programYearDetails =
        await ApplicationService.shared.getApplicationWithPY(props.id, true);
      if (!programYearDetails.active) {
        isReadOnly.value = true;
        snackBar.error(
          "This application can no longer be edited or submitted",
          snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
        );
      }
    };

    onMounted(async () => {
      const { isFulltimeAllowed } = await AppConfigService.shared.config();
      await checkProgramYear();
      //Get the student information, application information and student restriction.
      const [studentInfo, applicationData] = await Promise.all([
        StudentService.shared.getStudentProfile(),
        ApplicationService.shared.getApplicationData(props.id),
      ]);

      // Define if the form should be read-only.
      if (props.readOnly) {
        // If some value is provided in the read-only prop, then the form should be readonly.
        isReadOnly.value = true;
      } else if (
        // If a change request is being made in the expected application status,
        // then the form should be editable.
        props.changeRequest &&
        applicationData.applicationStatus === ApplicationStatus.Completed
      ) {
        isReadOnly.value = false;
      } else {
        // If the application status is Completed, Cancelled or Edited, then the form should be read-only.
        isReadOnly.value = [
          ApplicationStatus.Completed,
          ApplicationStatus.Cancelled,
          ApplicationStatus.Edited,
        ].includes(applicationData.applicationStatus);
      }

      notDraft.value =
        !!props.readOnly ||
        ![ApplicationStatus.Draft].includes(applicationData.applicationStatus);

      const address = studentInfo.contact;

      const formattedAddress = getFormattedAddress(address.address);
      const studentFormData = {
        studentGivenNames: studentInfo.firstName,
        studentLastName: studentInfo.lastName,
        studentGender: genderDisplayFormat(studentInfo.gender),
        studentDateOfBirth: studentInfo.birthDateFormatted,
        studentPhoneNumber: studentInfo.contact.phone,
        studentHomeAddress: formattedAddress,
        studentEmail: studentInfo.email,
        disabilityStatus: disabilityStatusToDisplay(
          studentInfo.disabilityStatus,
        ),
        studentProfileDisabilityStatusValue: studentInfo.disabilityStatus,
      };
      const programYear = {
        programYearStartDate: applicationData.programYearStartDate,
        programYearEndDate: applicationData.programYearEndDate,
      };
      // The property to indicate the change request must be set during the edit.
      // The change request start with the copy of the preceding application data
      // and this property must be reset.
      applicationData.data.isChangeRequestApplication = props.changeRequest;
      initialData.value = {
        ...applicationData.data,
        applicationOfferingIntensityValue:
          applicationData.applicationOfferingIntensity,
        ...studentFormData,
        ...programYear,
        isReadOnly: isReadOnly.value,
        isFulltimeAllowed,
      };
      existingApplication.value = applicationData;
      isDataReady.value = true;
    });

    const callSaveDraft = async () => {
      const associatedFiles = formioUtils.getAssociatedFiles(applicationWizard);
      await ApplicationService.shared.saveApplicationDraft(props.id, {
        programYearId: props.programYearId,
        data: applicationWizard.submission.data,
        associatedFiles,
      });
      savedDraftData = JSON.stringify(applicationWizard.submission.data);
    };

    // Save the current state of the student application skipping all validations.
    const saveDraft = async () => {
      savingDraft.value = true;
      try {
        await callSaveDraft();
        snackBar.success("Application draft saved with success.");
      } catch {
        snackBar.error("An unexpected error has happened.");
      } finally {
        savingDraft.value = false;
      }
    };

    const saveDraftAutomatically = async () => {
      automaticDraftSaveInProgress = true;
      try {
        await callSaveDraft();
      } finally {
        automaticDraftSaveInProgress = false;
      }
    };

    // Execute the final submission of the student application.
    const submitApplication = async (data: unknown, form: FormIOForm) => {
      const associatedFiles = formioUtils.getAssociatedFiles(form);
      if (props.changeRequest) {
        await changeRequestSubmission(data, associatedFiles);
        return;
      }
      await applicationSubmission(data, associatedFiles);
    };

    const changeRequestSubmission = async (
      data: unknown,
      associatedFiles: string[],
    ): Promise<void> => {
      submittingApplication.value = true;
      try {
        await ApplicationService.shared.submitApplication(
          props.id,
          {
            programYearId: props.programYearId,
            data,
            associatedFiles,
          },
          { isChangeRequest: true },
        );
        snackBar.success("Thank you, your change request has been submitted.");
        await router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: props.id,
          },
        });
      } catch (error: unknown) {
        let errorLabel = "Unexpected error!";
        let errorMsg = "An unexpected error has happened.";
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS:
              snackBar.warn(error.message);
              return;
            case ACTIVE_STUDENT_RESTRICTION:
              errorLabel = "Active restriction!";
              errorMsg = error.message;
              break;
            default:
              errorMsg = error.message;
              break;
          }
        }
        snackBar.error(`${errorLabel} ${errorMsg}`);
      } finally {
        submittingApplication.value = false;
      }
    };

    const applicationSubmission = async (
      data: unknown,
      associatedFiles: string[],
    ): Promise<void> => {
      submittingApplication.value = true;
      try {
        await ApplicationService.shared.submitApplication(props.id, {
          programYearId: props.programYearId,
          data,
          associatedFiles,
        });
        snackBar.success("Thank you, your application has been submitted.");
        await router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        });
      } catch (error: unknown) {
        let errorLabel = "Unexpected error!";
        let errorMsg = "An unexpected error has happened.";
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case STUDY_DATE_OVERLAP_ERROR:
              errorLabel = "Invalid submission.";
              errorMsg = error.message;
              break;
            case ACTIVE_STUDENT_RESTRICTION:
              errorLabel = "Active restriction!";
              errorMsg = error.message;
              break;
            default:
              errorMsg = error.message;
              break;
          }
        }
        snackBar.error(`${errorLabel} ${errorMsg}`);
      } finally {
        submittingApplication.value = false;
      }
    };

    const editApplication = () => {
      applicationWizard.submit();
    };

    const loadForm = async (form: any) => {
      applicationWizard = form;
    };

    const pageChanged = async (
      isInFirstPage: boolean,
      _currentPage: number,
      isInLastPage: boolean,
    ) => {
      isFirstPage.value = isInFirstPage;
      isLastPage.value = isInLastPage;
      if (!savedDraftData) {
        savedDraftData = JSON.stringify(applicationWizard.submission.data);
      }
      const dataChanged =
        savedDraftData !== JSON.stringify(applicationWizard.submission.data);
      if (
        !notDraft.value &&
        !isFirstPage.value &&
        !submittingApplication.value &&
        !automaticDraftSaveInProgress &&
        !savingDraft.value &&
        dataChanged
      ) {
        await saveDraftAutomatically();
      }
    };

    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      if (FormIOCustomEventTypes.RouteToStudentProfile === event.type) {
        router.push({
          name: StudentRoutesConst.STUDENT_PROFILE_EDIT,
        });
      }
    };

    const confirmEditApplication = async () => {
      if (await editApplicationModal.value.showModal()) {
        editApplication();
      } else {
        conditionsAccepted.value = false;
      }
    };

    const wizardSubmit = async () => {
      if (
        existingApplication.value.applicationStatus !== ApplicationStatus.Draft
      ) {
        isStudyEndDateWithinDeadline.value =
          applicationWizard.submission.data
            .studyEndDateBeforeSixWeeksFromToday ||
          applicationWizard.submission.data
            .selectedStudyEndDateBeforeSixWeeksFromToday;
        await confirmEditApplication();
      } else {
        applicationWizard.submit();
      }
    };
    return {
      initialData,
      isStudyEndDateWithinDeadline,
      loadForm,
      wizardSubmit,
      saveDraft,
      submitApplication,
      savingDraft,
      submittingApplication,
      customEventCallback,
      isReadOnly,
      notDraft,
      confirmEditApplication,
      editApplication,
      editApplicationModal,
      pageChanged,
      isFirstPage,
      isLastPage,
      conditionsAccepted,
      BannerTypes,
      isDataReady,
    };
  },
});
</script>
