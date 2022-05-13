<template>
  <div class="p-m-4">
    <RestrictionBanner
      v-if="hasRestriction"
      :restrictionMessage="restrictionMessage"
    />
    <CheckValidSINBanner />
    <HeaderNavigator subTitle="My Applications" />
    <v-row>
      <span class="p-m-4"
        >A list of your applications for funding, grants, and busaries.</span
      >
      <v-col cols="12">
        <span class="float-right"
          ><StartApplication :hasRestriction="hasRestriction"
        /></span>
      </v-col>
      <v-col cols="12">
        <StudentApplications
          :hasRestriction="hasRestriction"
          :reloadData="reloadData"
          @editApplicationAction="editApplicationAction"
          @openConfirmCancel="openConfirmCancel"
          @goToApplication="goToApplication"
        />
      </v-col>
    </v-row>
  </div>
  <ConfirmEditApplication ref="editApplicationModal" />
  <CancelApplication
    :showModal="showModal"
    :applicationId="selectedApplicationId"
    @showHideCancelApplication="showHideCancelApplication"
    @reloadData="setReloadData"
  />
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { StudentService } from "@/services/StudentService";
import StartApplication from "@/views/student/financial-aid-application/Applications.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import { ApplicationStatus } from "@/types";
import StudentApplications from "@/components/aest/StudentApplications.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { useRouter } from "vue-router";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useToastMessage, ModalDialog } from "@/composables";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";

export default {
  components: {
    StartApplication,
    RestrictionBanner,
    StudentApplications,
    CheckValidSINBanner,
    ConfirmEditApplication,
    CancelApplication,
  },
  setup() {
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const router = useRouter();
    const toast = useToastMessage();
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const showModal = ref(false);
    const selectedApplicationId = ref(0);
    const reloadData = ref(false);

    const openConfirmCancel = (id: number) => {
      showModal.value = true;
      selectedApplicationId.value = id;
    };

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
      } catch (error) {
        toast.error(
          "Unexpected Error",
          undefined,
          toast.EXTENDED_MESSAGE_DISPLAY_TIME,
        );
      }
    };

    const confirmEditApplication = async (applicationId: number) => {
      if (await editApplicationModal.value.showModal()) {
        goToEditApplication(applicationId);
      }
    };

    const editApplicationAction = async (
      status: ApplicationStatus,
      applicationId: number,
    ) => {
      if (status !== ApplicationStatus.draft)
        confirmEditApplication(applicationId);
      else goToEditApplication(applicationId);
    };

    const setReloadData = () => {
      reloadData.value = true;
    };

    const goToApplication = (id: number) => {
      return router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
        params: {
          id: id,
        },
      });
    };

    onMounted(async () => {
      const restrictions = await StudentService.shared.getStudentRestriction();
      hasRestriction.value = restrictions.hasRestriction;
      restrictionMessage.value = restrictions.restrictionMessage;
    });

    return {
      ApplicationStatus,
      hasRestriction,
      restrictionMessage,
      editApplicationAction,
      editApplicationModal,
      openConfirmCancel,
      showModal,
      selectedApplicationId,
      showHideCancelApplication,
      reloadData,
      setReloadData,
      goToApplication,
    };
  },
};
</script>
