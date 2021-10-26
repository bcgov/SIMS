<template>
  <div class="p-m-4">
    <Message severity="error" v-if="hasRestriction">
      {{ restrictionMessage }}
    </Message>
    <h1><strong>My Applications</strong></h1>
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
        <DataTable :autoLayout="true" :value="myApplications" class="p-m-4">
          <Column field="applicationNumber" header="Application #"> </Column>
          <Column field="applicationName" header="Name"
            ><template #body="slotProps">
              <v-btn
                plain
                @click="goToApplication(slotProps.data.id)"
                color="primary"
                v-tooltip="'Click To View this Application'"
                >{{ slotProps.data.applicationName }}
              </v-btn>
            </template>
          </Column>
          <Column field="studyStartPeriod" header="Study Period">
            <template #body="slotProps">
              <span>
                {{ dateString(slotProps.data.studyStartPeriod) }} -
                {{ dateString(slotProps.data.studyEndPeriod) }}
              </span>
            </template></Column
          >
          <Column field="award" header="Award"></Column>
          <Column field="status" header="Status">
            <template #body="slotProps">
              <Chip
                :label="slotProps.data.status"
                class="text-uppercase"
                :class="getApplicationStatusClass(slotProps.data.status)"
              />
            </template>
          </Column>
          <Column field="id" header=""
            ><template #body="slotProps">
              <span
                v-if="
                  !(
                    slotProps.data.status === ApplicationStatus.cancelled ||
                    slotProps.data.status === ApplicationStatus.completed
                  )
                "
              >
                <v-btn :disabled="hasRestriction" plain>
                  <v-icon
                    size="25"
                    v-tooltip="'Click To Edit this Application'"
                    @click="
                      slotProps.data.status !== ApplicationStatus.draft
                        ? confirmEditApplication(slotProps.data.id)
                        : editApplicaion(slotProps.data.id)
                    "
                    >mdi-pencil</v-icon
                  ></v-btn
                >
                <v-btn :disabled="hasRestriction" plain>
                  <v-icon
                    size="25"
                    v-tooltip="'Click To Cancel this Application'"
                    @click="openConfirmCancel(slotProps.data.id)"
                    >mdi-trash-can-outline</v-icon
                  >
                </v-btn>
              </span>
            </template>
          </Column>
        </DataTable>
      </v-col>
    </v-row>
    <CancelApplication
      :showModal="showModal"
      :applicationId="selectedApplicationId"
      @showHideCancelApplication="showHideCancelApplication"
      @reloadData="loadApplicationSummary"
    />
    <ConfirmEditApplication ref="editApplicationModal" />
  </div>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { StudentService } from "@/services/StudentService";
import StartApplication from "@/views/student/financial-aid-application/Applications.vue";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { useFormatters, ModalDialog } from "@/composables";
import Tooltip from "primevue/tooltip";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import {
  ApplicationStatus,
  ProgramYearOfApplicationDto,
  StudentApplication,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";

export default {
  components: {
    StartApplication,
    DataTable,
    Column,
    CancelApplication,
    ConfirmEditApplication,
  },
  directives: {
    tooltip: Tooltip,
  },
  setup() {
    const showModal = ref(false);
    const router = useRouter();
    const selectedApplicationId = ref(0);
    const { dateString } = useFormatters();
    const myApplications = ref([] as StudentApplication[]);
    const programYear = ref({} as ProgramYearOfApplicationDto);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const hasRestriction = ref(true);
    const restrictionMessage = ref("");

    const getApplicationStatusClass = (status: string) => {
      switch (status) {
        case ApplicationStatus.draft:
          return "bg-secondary text-white";
        case ApplicationStatus.inProgress:
          return "bg-warning text-white";
        case ApplicationStatus.assessment:
          return "bg-dark text-white";
        case ApplicationStatus.enrollment:
          return "bg-primary text-white";
        case ApplicationStatus.completed:
          return "bg-success text-white";
        case ApplicationStatus.cancelled:
          return "bg-danger text-white";
        case ApplicationStatus.submitted:
          return "bg-info text-white";
        default:
          return "";
      }
    };

    const openConfirmCancel = (id: number) => {
      showModal.value = true;
      selectedApplicationId.value = id;
    };

    const showHideCancelApplication = () => {
      showModal.value = !showModal.value;
    };

    const goToApplication = (id: number) => {
      return router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
        params: {
          id: id,
        },
      });
    };

    const loadApplicationSummary = async () => {
      myApplications.value = await StudentService.shared.getAllStudentApplications();
    };

    const getProgramYear = async (applicationId: number) => {
      programYear.value = await ApplicationService.shared.getProgramYearOfApplication(
        applicationId,
      );
    };

    const editApplicaion = async (applicationId: number) => {
      await getProgramYear(applicationId);
      router.push({
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
        params: {
          selectedForm: programYear.value.formName,
          programYearId: programYear.value.programYearId,
          id: applicationId,
        },
      });
    };

    const confirmEditApplication = async (id: number) => {
      if (await editApplicationModal.value.showModal()) {
        editApplicaion(id);
      }
    };

    onMounted(async () => {
      const studentRestriction = await StudentService.shared.getAllStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
      await loadApplicationSummary();
    });

    return {
      myApplications,
      goToApplication,
      dateString,
      getApplicationStatusClass,
      openConfirmCancel,
      showModal,
      selectedApplicationId,
      showHideCancelApplication,
      loadApplicationSummary,
      ApplicationStatus,
      editApplicaion,
      editApplicationModal,
      confirmEditApplication,
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>
