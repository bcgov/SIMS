<template>
  <student-page-container :full-width="true">
    <template #header>
      <header-navigator title="Applications" subTitle="My Applications">
        <template #buttons>
          <start-application />
        </template>
      </header-navigator>
    </template>
    <v-row>
      <v-col cols="12">
        <student-applications
          :manage-application="true"
          :enable-view-application-on-name="true"
          @editApplicationAction="editApplicationAction"
          @openConfirmCancel="confirmCancelApplication"
          @goToApplication="goToApplication"
        />
      </v-col>
    </v-row>
  </student-page-container>
  <confirm-edit-application ref="editApplicationModal" :beforeEdit="true" />
  <cancel-application ref="cancelApplicationModal" />
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import StartApplication from "@/views/student/financial-aid-application/Applications.vue";
import { ApplicationStatus } from "@/types";
import StudentApplications from "@/components/common/students/StudentApplications.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { useRouter } from "vue-router";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog } from "@/composables";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import CancelApplication from "@/components/students/modals/CancelApplication.vue";

export default defineComponent({
  components: {
    StartApplication,
    StudentApplications,
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

    const showHideCancelApplication = () => {
      showModal.value = !showModal.value;
    };

    const getApplicationWithPY = async (applicationId: number) => {
      return ApplicationService.shared.getApplicationWithPY(applicationId);
    };

    const goToEditApplication = async (applicationId: number) => {
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
        await goToEditApplication(applicationId);
      }
    };

    const editApplicationAction = async (
      status: ApplicationStatus,
      applicationId: number,
    ) => {
      if (status !== ApplicationStatus.Draft) {
        await confirmEditApplication(applicationId);
      } else {
        await goToEditApplication(applicationId);
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
      cancelApplicationModal,
    };
  },
});
</script>
