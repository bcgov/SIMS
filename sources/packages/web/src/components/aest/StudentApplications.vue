<template>
  <p class="category-header-large color-blue">Applications</p>
  <v-col>
    <DataTable
      :value="applicationAndCount.applications"
      :lazy="true"
      :paginator="true"
      :rows="DEFAULT_PAGE_LIMIT"
      :rowsPerPageOptions="PAGINATION_LIST"
      :totalRecords="applicationAndCount.totalApplications"
      @page="paginationAndSortEvent($event)"
      @sort="paginationAndSortEvent($event)"
      :loading="loading"
    >
      <template #empty>
        <p class="text-center font-weight-bold">No records found.</p>
      </template>
      <Column
        :field="StudentApplicationFields.ApplicationNumber"
        sortable="true"
        header="Application #"
      >
      </Column>
      <Column :field="StudentApplicationFields.ApplicationName" header="Name">
        <template #body="slotProps">
          <v-btn plain color="primary">{{
            slotProps.data.applicationName
          }}</v-btn>
        </template></Column
      >
      <Column
        :field="StudentApplicationFields.StudyPeriod"
        header="Study Period"
      >
        <template #body="slotProps">
          <span>
            {{ dateString(slotProps.data.studyStartPeriod) }} -
            {{ dateString(slotProps.data.studyEndPeriod) }}
          </span>
        </template></Column
      >
      <Column :field="StudentApplicationFields.Award" header="Award"></Column>
      <Column :field="StudentApplicationFields.Status" header="Status">
        <template #body="slotProps">
          <Status :statusValue="slotProps.data.status" />
        </template>
      </Column>
      <Column :field="StudentApplicationFields.Actions" header="Status">
        <template #body>
          <v-btn>View</v-btn>
        </template>
      </Column>
    </DataTable>
  </v-col>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import {
  StudentDetail,
  ApplicationStatus,
  StudentApplicationAndCount,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
  StudentApplicationFields,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import Status from "@/views/student/ApplicationStatus.vue";

export default {
  components: { Status },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const studentDetail = ref({} as StudentDetail);
    const loading = ref(false);
    const applicationAndCount = ref({} as StudentApplicationAndCount);
    const defaultSortOrder = -1;
    const currentPage = ref();
    const currentPageLimit = ref();
    const { dateString } = useFormatters();

    const getStudentApplications = async (
      page = DEFAULT_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = StudentApplicationFields.ApplicationNumber,
      sortOrder = DataTableSortOrder.ASC,
    ) => {
      applicationAndCount.value = await ApplicationService.shared.getAllApplicationsForStudent(
        props.studentId,
        page,
        pageCount,
        sortField,
        sortOrder,
      );
    };
    onMounted(async () => {
      await getStudentApplications();
    });

    // pagination sort event callback
    const paginationAndSortEvent = async (event: any) => {
      loading.value = true;
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await getStudentApplications(
        event?.page,
        event?.rows,
        event?.sortField,
        event?.sortOrder,
      );
      loading.value = false;
    };
    return {
      studentDetail,
      dateString,
      ApplicationStatus,
      applicationAndCount,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_NUMBER,
      DataTableSortOrder,
      PAGINATION_LIST,
      paginationAndSortEvent,
      loading,
      defaultSortOrder,
      StudentApplicationFields,
    };
  },
};
</script>
