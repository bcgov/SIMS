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
import { ApplicationStatus, ProgramYearOfApplicationDto } from "@/types";
import StudentApplications from "@/components/aest/StudentApplications.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
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
    HeaderNavigator,
    ConfirmEditApplication,
    CancelApplication,
  },
  setup() {
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const programYear = ref({} as ProgramYearOfApplicationDto);
    const router = useRouter();
    const toast = useToastMessage();
    const TOAST_ERROR_DISPLAY_TIME = 15000;
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

    const getProgramYear = async (applicationId: number) => {
      programYear.value = await ApplicationService.shared.getProgramYearOfApplication(
        applicationId,
      );
    };

    const editApplication = async (applicationId: number) => {
      try {
        await getProgramYear(applicationId);
        router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: programYear.value.formName,
            programYearId: programYear.value.programYearId,
            id: applicationId,
          },
        });
      } catch (error) {
        toast.error(
          "Program Year not active",
          undefined,
          TOAST_ERROR_DISPLAY_TIME,
        );
      }
    };

    const confirmEditApplication = async (applicationId: number) => {
      if (await editApplicationModal.value.showModal()) {
        editApplication(applicationId);
      }
    };

    const editApplicationAction = async (
      status: ApplicationStatus,
      applicationId: number,
    ) => {
      if (status !== ApplicationStatus.draft)
        confirmEditApplication(applicationId);
      else editApplication(applicationId);
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
