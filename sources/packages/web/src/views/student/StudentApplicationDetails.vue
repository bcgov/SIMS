<template>
  <div class="p-m-4">
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Applications</a
      >
    </h5>
    <h1><strong>Financial Aid Application</strong></h1>
    <v-btn color="primary" class="float-right ml-2" @click="toggle"
      >Application Options
      <v-icon size="25"> mdi-arrow-down-bold-circle</v-icon></v-btn
    >
    <Menu class="mt-n15" ref="menu" :model="items" :popup="true" />
    <v-btn
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
          <a class="text-primary"> View application </a>
        </span>
      </div>
    </v-container>
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import Menu from "primevue/menu";
import { onMounted, ref, watch } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import { ApplicationService } from "@/services/ApplicationService";
import {
  GetApplicationDataDto,
  ApplicationStatus,
} from "@/types/contracts/students/ApplicationContract";
import "@/assets/css/student.css";
import { useFormatters } from "@/composables";
import { ProgramYearOfApplicationDto } from "@/types";

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
    const showHideCancelApplication = () => {
      showModal.value = !showModal.value;
    };
    const goBack = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
      });
    };
    const getProgramYear = async () => {
      programYear.value = await ApplicationService.shared.getProgramYearOfApplication(
        props.id,
      );
    };

    const editApplicaion = async () => {
      await getProgramYear();
      router.push({
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
        params: {
          selectedForm: programYear.value.formName,
          programYearId: programYear.value.programYearId,
          id: props.id,
        },
      });
    };
    const viewApplicaion = async () => {
      await getProgramYear();
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
    const loadMenu = () => {
      items.value = [
        {
          label: "Edit",
          icon: "pi pi-fw pi-pencil",
          command: () => {
            editApplicaion();
          },
        },
        { separator: true },
        {
          label: "View",
          icon: "pi pi-fw pi-folder-open",
          command: () => {
            viewApplicaion();
          },
        },
      ];
      if (
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.cancelled &&
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.completed
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
      goBack,
      applicationDetails,
      getApplicationDetails,
      dateString,
      ApplicationStatus,
    };
  },
};
</script>
