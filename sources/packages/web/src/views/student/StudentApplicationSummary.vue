<template>
  <student-page-container :full-width="true">
    <template #header>
      <header-navigator title="Applications" subTitle="My Applications">
        <template #buttons>
          <start-application :class="{ 'mb-2': isMobile }" />
        </template>
      </header-navigator>
    </template>
    <v-row>
      <v-col cols="12" :class="{ 'pa-0': isMobile }">
        <student-applications-extended-summary
          :dense="isMobile"
          @editApplicationAction="editApplicationAction"
          @openConfirmCancel="confirmCancelApplication"
          @goToApplication="goToApplication"
          @viewApplicationVersion="goToApplicationForm"
        />
      </v-col>
    </v-row>
  </student-page-container>
  <confirm-edit-application ref="editApplicationModal" />
  <cancel-application ref="cancelApplicationModal" />
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import StartApplication from "@/views/student/financial-aid-application/Applications.vue";
import { ApplicationStatus } from "@/types";
import StudentApplicationsExtendedSummary from "@/components/students/StudentApplicationsExtendedSummary.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { useRouter } from "vue-router";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog } from "@/composables";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import CancelApplication from "@/components/students/modals/CancelApplication.vue";
import { useDisplay } from "vuetify";

export default defineComponent({
  components: {
    StartApplication,
    StudentApplicationsExtendedSummary,
    ConfirmEditApplication,
    CancelApplication,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const showModal = ref(false);
    const reloadData = ref(false);
    const cancelApplicationModal = ref({} as ModalDialog<boolean>);
    const { mobile: isMobile } = useDisplay();

    const showHideCancelApplication = () => {
      showModal.value = !showModal.value;
    };

    const getApplicationWithPY = async (applicationId: number) => {
      return ApplicationService.shared.getApplicationWithPY(applicationId);
    };

    const goToApplicationForm = async (applicationId: number) => {
      try {
        const applicationWithPY = await getApplicationWithPY(applicationId);
        router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: applicationWithPY.formName,
            programYearId: applicationWithPY.programYearId,
            id: applicationId,
          },
        });
      } catch {
        snackBar.error(
          "Unexpected Error",
          snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
        );
      }
    };

    const confirmEditApplication = async (applicationId: number) => {
      if (await editApplicationModal.value.showModal()) {
        await goToApplicationForm(applicationId);
      }
    };

    const editApplicationAction = async (
      status: ApplicationStatus,
      applicationId: number,
    ) => {
      if (status !== ApplicationStatus.Draft) {
        await confirmEditApplication(applicationId);
      } else {
        await goToApplicationForm(applicationId);
      }
    };

    const confirmCancelApplication = async (
      applicationId: number,
      reloadApplicationSummary: () => void,
    ) => {
      if (await cancelApplicationModal.value.showModal(applicationId)) {
        // Reload details.
        reloadApplicationSummary();
      }
    };

    const goToApplication = (id: number) => {
      return router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
        params: {
          id: id,
        },
      });
    };

    return {
      ApplicationStatus,
      editApplicationAction,
      editApplicationModal,
      confirmCancelApplication,
      showModal,
      showHideCancelApplication,
      reloadData,
      goToApplication,
      goToApplicationForm,
      cancelApplicationModal,
      isMobile,
    };
  },
});
</script>
