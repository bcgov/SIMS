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
          <Column field="applicationNumber" header="Application #">
            <template #body="slotProps">
              <v-btn
                plain
                @click="goToApplication(slotProps.data.id)"
                color="primary"
                >{{ slotProps.data.applicationNumber }}</v-btn
              >
            </template>
          </Column>
          <Column field="applicationName" header="Name"></Column>
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
                v-if="slotProps.data.status === 'completed'"
                label="COMPLETE"
                class="p-mr-2 p-mb-2 bg-success text-white"
              />
            </template>
          </Column>
        </DataTable>
      </v-col>
    </v-row>
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

export default {
  components: {
    StartApplication,
    DataTable,
    Column,
  },
  setup() {
    const router = useRouter();
    const { dateString } = useFormatters();
    const myApplications = ref([] as StudentApplication[]);
    const goToApplication = (id: number) => {
      return router.push({
        name: StudentRoutesConst.STUDENT_EDIT_APPLICATION,
        params: {
          id: id,
        },
      });
    };

    onMounted(async () => {
      myApplications.value = await StudentService.shared.getAllStudentApplications();
    });
    return { myApplications, goToApplication, dateString };
  },
};
</script>
