<template>
  <student-page-container layout-template="centered">
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
                v-bind="props"
                prepend-icon="fa:fa fa-chevron-circle-down"
                >Application actions
              </v-btn>
            </template>
            <v-list
              class="action-list"
              active-class="active-list-item"
              density="compact"
              bg-color="default"
              color="primary"
            >
              <template v-for="(item, index) in items" :key="index">
                <v-list-item :value="index" @click="item.command" tabindex="0">
                  <template v-slot:prepend>
                    <v-icon :icon="item.icon" :color="item.iconColor"></v-icon>
                  </template>
                  <v-list-item-title :class="item.textColor">
                    <span class="label-bold"> {{ item.label }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-divider-inset-opaque
                  v-if="index < items.length - 1"
                  :key="index"
                ></v-divider-inset-opaque>
              </template>
            </v-list>
          </v-menu>
        </template>
      </header-navigator>
      <detail-header
        :headerMap="headerMap"
        v-if="applicationDetails.applicationStatus !== ApplicationStatus.Draft"
      />
    </template>

    <application-progress-bar
      class="mb-5"
      :application-id="id"
      @editApplication="editApplication"
      :application-status="applicationDetails.applicationStatus"
    />
    <student-assessment-details :applicationId="id" v-if="showViewAssessment" />
  </student-page-container>

  <confirm-edit-application ref="editApplicationModal" :beforeEdit="true" />
  <cancel-application ref="cancelApplicationModal" />

  <!-- Submitted date footer. -->
  <div
    class="text-center my-3 muted-content"
    v-if="applicationDetails.applicationStatus !== ApplicationStatus.Draft"
  >
    <span class="header-text-small">Date submitted: </span
    ><span class="value-text-small">{{
      dateOnlyLongString(applicationDetails.submittedDate)
    }}</span>
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, watch, computed, defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import CancelApplication from "@/components/students/modals/CancelApplication.vue";
import { ApplicationService } from "@/services/ApplicationService";
import "@/assets/css/student.scss";
import {
  useFormatters,
  ModalDialog,
  useSnackBar,
  useApplication,
} from "@/composables";
import { ApplicationStatus, MenuType } from "@/types";
import { ApplicationDataAPIOutDTO } from "@/services/http/dto";
import ApplicationProgressBar from "@/components/students/applicationTracker/ApplicationProgressBar.vue";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import StudentAssessmentDetails from "@/components/students/StudentAssessmentDetails.vue";

export default defineComponent({
  components: {
    CancelApplication,
    ApplicationProgressBar,
    ConfirmEditApplication,
    DetailHeader,
    StudentAssessmentDetails,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const items = ref<MenuType[]>([]);
    const { dateOnlyLongString } = useFormatters();
    const applicationDetails = ref({} as ApplicationDataAPIOutDTO);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const cancelApplicationModal = ref({} as ModalDialog<boolean>);
    const snackBar = useSnackBar();
    const { mapApplicationDetailHeader } = useApplication();
    const headerMap = ref<Record<string, string>>({});

    const showViewAssessment = computed(() =>
      [
        ApplicationStatus.Assessment,
        ApplicationStatus.Enrolment,
        ApplicationStatus.Completed,
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
      } catch {
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

    const getApplicationDetails = async (applicationId: number) => {
      applicationDetails.value =
        await ApplicationService.shared.getApplicationData(applicationId);
      loadMenu();
    };

    const confirmEditApplication = async () => {
      if (await editApplicationModal.value.showModal()) {
        await editApplication();
      }
    };

    const loadMenu = () => {
      items.value = [];
      if (
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.Cancelled &&
        applicationDetails.value.applicationStatus !==
          ApplicationStatus.Completed
      ) {
        items.value.push({
          label: "Edit application",
          icon: "fa:fa fa-pencil-alt",
          command:
            applicationDetails.value.applicationStatus ===
            ApplicationStatus.Draft
              ? editApplication
              : confirmEditApplication,
        });

        items.value.push({
          label: "Cancel application",
          icon: "fa:fa fa-trash",
          iconColor: "error",
          textColor: "error-color",
          command: confirmCancelApplication,
        });
      }
      if (
        applicationDetails.value.applicationStatus ===
        ApplicationStatus.Completed
      ) {
        items.value.push({
          label: "Request a change",
          icon: "fa:fas fa-hand-paper",
          command: () => {
            router.push({
              name: StudentRoutesConst.STUDENT_REQUEST_CHANGE,
            });
          },
        });
      }
      // Default value in menu items.
      items.value.push({
        label: "View application",
        icon: "fa:fa fa-folder-open",
        command: viewApplication,
      });
    };

    const confirmCancelApplication = async () => {
      if (await cancelApplicationModal.value.showModal(props.id)) {
        // Reload details.
        await getApplicationDetails(props.id);
      }
    };

    watch(
      () => props.id,
      async (currValue: number) => {
        await getApplicationDetails(currValue);
        headerMap.value = mapApplicationDetailHeader(applicationDetails.value);
      },
      {
        immediate: true,
      },
    );

    return {
      items,
      StudentRoutesConst,
      applicationDetails,
      getApplicationDetails,
      dateOnlyLongString,
      ApplicationStatus,
      showViewAssessment,
      editApplicationModal,
      editApplication,
      viewApplication,
      headerMap,
      cancelApplicationModal,
    };
  },
});
</script>
