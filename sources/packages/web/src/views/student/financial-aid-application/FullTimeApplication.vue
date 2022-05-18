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
              strokeWidth="10" /></span
        ></v-btn>
      </v-col>
    </v-row>
    <StudentApplication
      :selectedForm="selectedForm"
      :initialData="initialData"
      :isReadOnly="isReadOnly"
      :programYearId="programYearId"
      @formLoadedCallback="loadForm"
      @submitApplication="submitApplication"
      @customEventCallback="customEventCallback"
      @pageChanged="pageChanged"
    />
  </full-page-container>
  <ConfirmEditApplication
    ref="editApplicationModal"
    @confirmEditApplication="editApplication"
  />
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { StudentService } from "@/services/StudentService";
import { ApplicationService } from "@/services/ApplicationService";
import {
  useFormioUtils,
  useToastMessage,
  ModalDialog,
  useFormatters,
} from "@/composables";
import {
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  ApplicationStatus,
  GetApplicationDataDto,
  ApiProcessError,
} from "@/types";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import { PIR_OR_DATE_OVERLAP_ERROR } from "@/constants";
import StudentApplication from "@/components/common/StudentApplication.vue";

export default {
  components: {
    StudentApplication,
    ConfirmEditApplication,
    RestrictionBanner,
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
    const formatter = useFormatters();
    const router = useRouter();
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const toast = useToastMessage();
    const savingDraft = ref(false);
    const submittingApplication = ref(false);
    let applicationWizard: any;
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const isReadOnly = ref(false);
    const notDraft = ref(false);
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const existingApplication = ref({} as GetApplicationDataDto);
    const editApplicationModal = ref({} as ModalDialog<boolean>);

    const checkProgramYear = async () => {
      // check program year, if not active allow only readonly mode with a toast
      const programYearDetails =
        await ApplicationService.shared.getApplicationWithPY(props.id, true);
      if (!programYearDetails.active) {
        isReadOnly.value = true;
        toast.error(
          "Unexpected Error",
          "This application can no longer be edited or submitted",
          toast.EXTENDED_MESSAGE_DISPLAY_TIME,
        );
      }
    };
    onMounted(async () => {
      await checkProgramYear();
      //Get the student information, application information and student restriction.
      const [studentInfo, applicationData, studentRestriction] =
        await Promise.all([
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

      const formattedAddress = formatter.getFormattedAddress(address.address);
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
      const programYear = {
        programYearStartDate: applicationData.programYearStartDate,
        programYearEndDate: applicationData.programYearEndDate,
      };
      initialData.value = {
        ...applicationData.data,
        ...studentFormData,
        ...programYear,
        isReadOnly: isReadOnly.value,
      };
      existingApplication.value = applicationData;
    });

    // Save the current state of the student application skipping all validations.
    const saveDraft = async () => {
      savingDraft.value = true;
      try {
        const associatedFiles =
          formioUtils.getAssociatedFiles(applicationWizard);
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
      } catch (error: unknown) {
        let errorLabel = "Unexpected error!";
        let errorMsg = "An unexpected error happen.";
        if (error instanceof ApiProcessError) {
          if (error.errorType === PIR_OR_DATE_OVERLAP_ERROR) {
            errorLabel = "Invalid submission";
            errorMsg = error.message;
          }
        }

        toast.error(errorLabel, errorMsg);
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

    const pageChanged = (
      isInFirstPage: boolean,
      currentPage: number,
      isInLastPage: boolean,
    ) => {
      isFirstPage.value = isInFirstPage;
      isLastPage.value = isInLastPage;
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
      hasRestriction,
      restrictionMessage,
      pageChanged,
      isFirstPage,
      isLastPage,
    };
  },
};
</script>
