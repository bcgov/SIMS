<template>
  <div class="p-m-4">
    <RestrictionBanner
      v-if="hasRestriction"
      :restrictionMessage="restrictionMessage"
    />
    <HeaderNavigator
      title="Back to Applications"
      :routeLocation="{
        name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
      }"
      subTitle="Financial aid application"
      ><template #buttons>
        <v-btn color="primary" @click="toggle"
          ><v-icon size="25">mdi-arrow-down-bold-circle</v-icon>Application
          Options
        </v-btn>
      </template>
    </HeaderNavigator>
    <Menu class="mt-n15" ref="menu" :model="items" :popup="true" />
    <v-btn
      v-if="showViewAssessment"
      color="primary"
      class="p-button-raised ml-2 float-right"
      @click="
        $router.push({
          name: StudentRoutesConst.ASSESSMENT,
          params: {
            applicationId: id,
          },
        })
      "
    >
      <v-icon size="25">mdi-text-box-plus</v-icon>
      View Assessment
    </v-btn>
    <CancelApplication
      :showModal="showModal"
      :applicationId="id"
      @showHideCancelApplication="showHideCancelApplication"
      @reloadData="getApplicationDetails"
    />

    <v-container class="pt-12">
      <div
        class="bg-white application-info-border"
        v-if="
          applicationDetails.applicationStatus === ApplicationStatus.cancelled
        "
      >
        <p>
          <v-icon color="primary">mdi-information </v-icon
          ><span class="pl-2 font-weight-bold">For your information</span>
        </p>
        <span class="mt-4"
          >This application was cancelled on
          {{ dateString(applicationDetails.applicationStatusUpdatedOn) }}.
          <a class="text-primary" @click="viewApplicaion"> View application </a>
        </span>
      </div>
      <ApplicationDetails
        v-if="applicationDetails?.applicationStatus"
        :applicationDetails="applicationDetails"
      />
      <ConfirmEditApplication ref="editApplicationModal" />
    </v-container>
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import Menu from "primevue/menu";
import { onMounted, ref, watch, computed } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import { ApplicationService } from "@/services/ApplicationService";
import "@/assets/css/student.scss";
import { useFormatters, ModalDialog, useToastMessage } from "@/composables";
import {
  ProgramYearOfApplicationDto,
  GetApplicationDataDto,
  ApplicationStatus,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import ApplicationDetails from "@/components/students/ApplicationDetails.vue";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
/**
 * added MenuType interface for prime vue component menu,
 *  remove it when vuetify componnt is used
 */
export interface MenuType {
  label?: string;
  icon?: string;
  separator?: boolean;
  command?: any;
}

export default {
  components: {
    Menu,
    CancelApplication,
    ApplicationDetails,
    ConfirmEditApplication,
    RestrictionBanner,
    HeaderNavigator,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const items = ref([] as MenuType[]);
    const menu = ref();
    const { dateString } = useFormatters();
    const programYear = ref({} as ProgramYearOfApplicationDto);
    const showModal = ref(false);
    const applicationDetails = ref({} as GetApplicationDataDto);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const toast = useToastMessage();
    const TOAST_ERROR_DISPLAY_TIME = 15000;

    const showHideCancelApplication = () => {
      showModal.value = !showModal.value;
    };
    const showViewAssessment = computed(() =>
      [
        ApplicationStatus.assessment,
        ApplicationStatus.enrollment,
        ApplicationStatus.completed,
      ].includes(applicationDetails.value?.applicationStatus),
    );

    const getProgramYear = async (includeInActivePY?: boolean) => {
      programYear.value = await ApplicationService.shared.getProgramYearOfApplication(
        props.id,
        includeInActivePY,
      );
    };

    const editApplication = async () => {
      try {
        await getProgramYear();
        router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: programYear.value.formName,
            programYearId: programYear.value.programYearId,
            id: props.id,
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
    const viewApplicaion = async () => {
      await getProgramYear(true);
      router.push({
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM_VIEW,
        params: {
          selectedForm: programYear.value.formName,
          programYearId: programYear.value.programYearId,
          id: props.id,
          readOnly: "readOnly",
        },
      });
    };
    const confirmEditApplication = async () => {
      if (await editApplicationModal.value.showModal()) {
        editApplication();
      }
    };
    const loadMenu = () => {
      if (
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.cancelled &&
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.completed &&
        !hasRestriction.value
      ) {
        items.value.push(
          {
            label: "Edit",
            icon: "pi pi-fw pi-pencil",
            command:
              applicationDetails.value.applicationStatus ===
              ApplicationStatus.draft
                ? editApplication
                : confirmEditApplication,
          },
          { separator: true },
        );
      }
      items.value.push({
        label: "View",
        icon: "pi pi-fw pi-folder-open",
        command: viewApplicaion,
      });
      if (
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.cancelled &&
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.completed &&
        !hasRestriction.value
      ) {
        items.value.push(
          { separator: true },
          {
            label: "Cancel",
            icon: "pi pi-fw pi-trash text-danger",
            command: () => {
              showHideCancelApplication();
            },
          },
        );
      }
    };
    const getApplicationDetails = async (applicationId: number) => {
      applicationDetails.value = await ApplicationService.shared.getApplicationData(
        applicationId,
      );
      loadMenu();
    };
    watch(
      () => props.id,
      async (currValue: number) => {
        //update the list
        await getApplicationDetails(currValue);
      },
    );
    onMounted(async () => {
      const studentRestriction = await StudentService.shared.getStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
      await getApplicationDetails(props.id);
    });
    const toggle = (event: any) => {
      menu?.value?.toggle(event);
    };
    return {
      items,
      toggle,
      menu,
      StudentRoutesConst,
      showHideCancelApplication,
      showModal,
      applicationDetails,
      getApplicationDetails,
      dateString,
      ApplicationStatus,
      showViewAssessment,
      editApplicationModal,
      editApplication,
      viewApplicaion,
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>
