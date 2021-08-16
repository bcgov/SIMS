<template>
  <div class="p-m-4">
    <h1><strong>My Applications</strong></h1>
    <v-row>
      <span class="p-m-4"
        >A list of your applications for funding, grants, and busaries.</span
      >
      <v-col cols="12">
        <span class="float-right"><StartApplication /></span>
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
                <v-btn plain>
                  <v-icon
                    size="25"
                    v-tooltip="'Click To Edit this Application'"
                    @click="openConfirmCancel(slotProps.data.id)"
                    >mdi-pencil</v-icon
                  ></v-btn
                >
                <v-btn plain>
                  <v-icon
                    size="25"
                    v-tooltip="'Click To Cancel this Application'"
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
      @showHidecancelApplication="showHidecancelApplication"
      @reloadData="loadApplicationSummary"
    />
  </div>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { StudentService } from "@/services/StudentService";
import StartApplication from "@/views/student/financial-aid-application/Applications.vue";
import { StudentApplication } from "@/types/contracts/StudentContract";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import Tooltip from "primevue/tooltip";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import { ApplicationStatus } from "@/types/contracts/students/ApplicationContract";

export default {
  components: {
    StartApplication,
    DataTable,
    Column,
    CancelApplication,
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
    const getApplicationStatusClass = (status: string) => {
      switch (status) {
        case "Draft":
          return "bg-secondary text-white";
        case "In Progress":
          return "bg-warning text-white";
        case "Assessment":
          return "bg-dark text-white";
        case "Enrollment":
          return "bg-primary text-white";
        case "Completed":
          return "bg-success text-white";
        case "Cancelled":
          return "bg-danger text-white";
        case "Submitted":
          return "bg-info text-white";
        default:
          return "";
      }
    };
    const openConfirmCancel = (id: number) => {
      showModal.value = true;
      selectedApplicationId.value = id;
    };
    const showHidecancelApplication = () => {
      showModal.value = !showModal.value;
    };
    const goToApplication = (id: number) => {
      return router.push({
        name: StudentRoutesConst.STUDEN_APPLICATION_DETAILS,
        params: {
          id: id,
        },
      });
    };
    const loadApplicationSummary = async () => {
      myApplications.value = await StudentService.shared.getAllStudentApplications();
    };
    onMounted(async () => {
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
      showHidecancelApplication,
      loadApplicationSummary,
      ApplicationStatus,
    };
  },
};
</script>
