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
              active-color="primary"
            >
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
      <detail-header
        :headerMap="headerMap"
        v-if="applicationDetails.applicationStatus !== ApplicationStatus.draft"
      />
    </template>

    <CancelApplication
      :showodal="showModal"
      :applicationId="id"
      @showHideCancelApplication="showHideCancelApplication"
      @reloadData="getApplicationDetails"
    />
    <application-progress-bar
      class="mb-5"
      :application-id="id"
      @editApplication="editApplication"
      :application-status="applicationDetails.applicationStatus"
      :status-updated-on="applicationDetails.applicationStatusUpdatedOn"
    />
    <student-assessment-details :applicationId="id" v-if="showViewAssessment" />
  </student-page-container>
  <confirm-edit-application ref="editApplicationModal" />

  <!-- Submitted date footer. -->
  <div
    class="text-center my-3 muted-content"
    v-if="applicationDetails.applicationStatus !== ApplicationStatus.draft"
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
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import { ApplicationService } from "@/services/ApplicationService";
import "@/assets/css/student.scss";
import {
  useFormatters,
  ModalDialog,
  useSnackBar,
  useApplication,
} from "@/composables";
import { ApplicationStatus, GetApplicationDataDto, MenuType } from "@/types";
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
    const showModal = ref(false);
    const applicationDetails = ref({} as GetApplicationDataDto);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const snackBar = useSnackBar();
    const { mapApplicationDetailHeader } = useApplication();
    const headerMap = ref<Record<string, string>>({});

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
      headerMap,
    };
  },
});
</script>
