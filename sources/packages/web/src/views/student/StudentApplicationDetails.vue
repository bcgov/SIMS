<template>
  <student-page-container layout-template="centered-card">
    <template #header>
      <header-navigator
        title="Applications"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        }"
        subTitle="Financial Aid Application"
        ><template #buttons>
          <v-menu>
            <template v-slot:activator="{ props }"
              ><v-btn
                color="primary"
                @click="toggle"
                v-bind="props"
                prepend-icon="fa:fa fa-chevron-circle-down"
                >Application actions
              </v-btn>
            </template>
            <v-list class="action-list">
              <template v-for="(item, index) in items" :key="index">
                <v-list-item :value="index" @click="item.command">
                  <template v-slot:prepend>
                    <v-icon :icon="item.icon" :color="item.iconColor"></v-icon>
                  </template>
                  <v-list-item-title :class="item.textColor">
                    <span class="label-bold"> {{ item.label }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-divider
                  v-if="index < items.length - 1"
                  :key="index"
                  inset
                ></v-divider>
              </template>
            </v-list>
          </v-menu>
        </template>
      </header-navigator>
    </template>
    <!-- todo: ann change the modal -->
    <CancelApplication
      :showModal="showModal"
      :applicationId="id"
      @showHideCancelApplication="showHideCancelApplication"
      @reloadData="getApplicationDetails"
    />
    <!-- todo: ann review if -->
    <application-progress-bar
      v-if="applicationDetails?.applicationStatus"
      :applicationId="id"
    />
  </student-page-container>
  <confirm-edit-application ref="editApplicationModal" />
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch, computed } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import { ApplicationService } from "@/services/ApplicationService";
import "@/assets/css/student.scss";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import { GetApplicationDataDto, ApplicationStatus, MenuType } from "@/types";
import ApplicationProgressBar from "@/components/students/applicationTracker/ApplicationProgressBar.vue";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";

export default {
  components: {
    CancelApplication,
    ApplicationProgressBar,
    ConfirmEditApplication,
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
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    // todo: ann check ifts really needed
    const applicationDetails = ref({} as GetApplicationDataDto);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const snackBar = useSnackBar();

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

    const getApplicationWithPY = async (
      isIncludeInActiveProgramYear?: boolean,
    ) => {
      return ApplicationService.shared.getApplicationWithPY(
        props.id,
        isIncludeInActiveProgramYear,
      );
    };

    const editApplication = async () => {
      try {
        const applicationWithPY = await getApplicationWithPY();
        router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: applicationWithPY.formName,
            programYearId: applicationWithPY.programYearId,
            id: props.id,
          },
        });
      } catch (error) {
        snackBar.error(
          "Unexpected Error",
          snackBar.EXTENDED_MESSAGE_DISPLAY_TIME,
        );
      }
    };

    const viewApplication = async () => {
      const applicationWithPY = await getApplicationWithPY(true);
      router.push({
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM_VIEW,
        params: {
          selectedForm: applicationWithPY.formName,
          programYearId: applicationWithPY.programYearId,
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
          ApplicationStatus.completed
      ) {
        items.value.push({
          label: "Edit application",
          icon: "fa:fa fa-pencil-alt",
          command:
            applicationDetails.value.applicationStatus ===
            ApplicationStatus.draft
              ? editApplication
              : confirmEditApplication,
        });
      }
      items.value.push({
        label: "View application",
        icon: "fa:fa fa-folder-open",
        command: viewApplication,
      });
      if (
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.cancelled &&
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.completed
      ) {
        items.value.push({
          label: "Cancel application",
          icon: "fa:fa fa-trash",
          iconColor: "error",
          textColor: "error-color",
          command: () => {
            showHideCancelApplication();
          },
        });
      }
    };

    const getApplicationDetails = async (applicationId: number) => {
      applicationDetails.value =
        await ApplicationService.shared.getApplicationData(applicationId);
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

    return {
      items,
      StudentRoutesConst,
      showHideCancelApplication,
      showModal,
      applicationDetails,
      getApplicationDetails,
      dateOnlyLongString,
      ApplicationStatus,
      showViewAssessment,
      editApplicationModal,
      editApplication,
      viewApplication,
    };
  },
};
</script>
