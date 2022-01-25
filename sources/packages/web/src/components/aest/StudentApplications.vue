<template>
  <!-- This component is shared between ministry and student users -->
  <p class="category-header-large color-blue">Applications</p>
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
        <v-btn
          v-if="clientType === ClientIdType.Student"
          plain
          @click="goToApplication(slotProps.data.id)"
          color="primary"
          v-tooltip="'Click To View this Application'"
          >{{ slotProps.data.applicationName }}
        </v-btn>
        <span v-if="clientType === ClientIdType.AEST"
          >{{ slotProps.data.applicationName }}
        </span>
      </template>
    </Column>
    <Column
      :field="StudentApplicationFields.Submitted"
      header="Submitted"
    ></Column>
    <Column :field="StudentApplicationFields.StudyPeriod" header="Study Period">
      <template #body="slotProps">
        <span>
          {{ dateString(slotProps.data.studyStartPeriod) }} -
          {{ dateString(slotProps.data.studyEndPeriod) }}
        </span>
      </template></Column
    >
    <Column
      :field="StudentApplicationFields.Status"
      header="Status"
      sortable="true"
    >
      <template #body="slotProps">
        <Status :statusValue="slotProps.data.status" />
      </template>
    </Column>
    <Column :field="StudentApplicationFields.Actions" header="Actions">
      <template #body="slotProps">
        <span v-if="clientType === ClientIdType.Student">
          <span
            v-if="
              !(
                slotProps.data.status === ApplicationStatus.cancelled ||
                slotProps.data.status === ApplicationStatus.completed
              )
            "
          >
            <v-btn
              :disabled="
                hasRestriction || sinValidStatus !== SINStatusEnum.VALID
              "
              plain
            >
              <font-awesome-icon
                :icon="['fas', 'pen']"
                class="mr-2"
                v-tooltip="'Click To Edit this Application'"
                @click="
                  slotProps.data.status !== ApplicationStatus.draft
                    ? confirmEditApplication(slotProps.data.id)
                    : editApplicaion(slotProps.data.id)
                "
              />
            </v-btn>
            <v-btn
              :disabled="
                hasRestriction || sinValidStatus !== SINStatusEnum.VALID
              "
              plain
            >
              <font-awesome-icon
                :icon="['fas', 'trash']"
                v-tooltip="'Click To Cancel this Application'"
                @click="openConfirmCancel(slotProps.data.id)"
              />
            </v-btn>
          </span>
        </span>
        <span v-if="clientType === ClientIdType.AEST">
          <v-btn outlined>View</v-btn>
        </span>
      </template>
    </Column>
  </DataTable>
  <CancelApplication
    :showModal="showModal"
    :applicationId="selectedApplicationId"
    @showHideCancelApplication="showHideCancelApplication"
    @reloadData="reloadApplication"
  />
  <ConfirmEditApplication ref="editApplicationModal" />
</template>

<script lang="ts">
import { onMounted, ref, computed } from "vue";
import {
  StudentDetail,
  ApplicationStatus,
  StudentApplicationAndCount,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
  StudentApplicationFields,
  ProgramYearOfApplicationDto,
  ClientIdType,
  SINStatusEnum,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentService } from "@/services/StudentService";
import { useFormatters, ModalDialog, useToastMessage } from "@/composables";
import Status from "@/views/student/ApplicationStatus.vue";
import { useRouter } from "vue-router";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import ConfirmEditApplication from "@/components/students/modals/ConfirmEditApplication.vue";
import CancelApplication from "@/components/students/modals/CancelApplicationModal.vue";
import { useStore } from "vuex";

export default {
  components: { Status, ConfirmEditApplication, CancelApplication },
  props: {
    clientType: {
      type: String,
      required: true,
    },
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
    const router = useRouter();
    const hasRestriction = ref(false);
    const editApplicationModal = ref({} as ModalDialog<boolean>);
    const programYear = ref({} as ProgramYearOfApplicationDto);
    const showModal = ref(false);
    const selectedApplicationId = ref(0);
    const toast = useToastMessage();
    const TOAST_ERROR_DISPLAY_TIME = 15000;

    const store = useStore();

    const sinValidStatus = computed(
      () => store.state.student.sinValidStatus.sinStatus,
    ).value;

    /**
     * function to load applicationListAndCount respective to the client type
     * @param page page number, if nothing passed then DEFAULT_PAGE_NUMBER
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT
     * @param sortField sort field, if nothing passed then StudentApplicationFields.status
     * @param sortOrder sort oder, if nothing passed then DataTableSortOrder.ASC
     */
    const getStudentApplications = async (
      page = DEFAULT_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = StudentApplicationFields.Status,
      sortOrder = DataTableSortOrder.ASC,
    ) => {
      switch (props.clientType) {
        case ClientIdType.Student:
          applicationAndCount.value = await StudentService.shared.getAllStudentApplications(
            page,
            pageCount,
            sortField,
            sortOrder,
          );
          break;
        case ClientIdType.AEST:
          applicationAndCount.value = await ApplicationService.shared.getAllApplicationAndCount(
            props.studentId,
            page,
            pageCount,
            sortField,
            sortOrder,
          );
          break;
      }
    };

    const reloadApplication = async () => {
      await getStudentApplications();
    };

    onMounted(async () => {
      if (props.clientType === ClientIdType.Student) {
        const restrictions = await StudentService.shared.getStudentRestriction();
        hasRestriction.value = restrictions.hasRestriction;
      }
      reloadApplication();
    });

    // pagination sort event callback
    const paginationAndSortEvent = async (event: any) => {
      loading.value = true;
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await getStudentApplications(
        event.page,
        event.rows,
        event.sortField,
        event.sortOrder,
      );
      loading.value = false;
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

    const getProgramYear = async (applicationId: number) => {
      programYear.value = await ApplicationService.shared.getProgramYearOfApplication(
        applicationId,
      );
    };

    const editApplicaion = async (applicationId: number) => {
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
    const confirmEditApplication = async (id: number) => {
      if (await editApplicationModal.value.showModal()) {
        editApplicaion(id);
      }
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
      goToApplication,
      hasRestriction,
      confirmEditApplication,
      editApplicationModal,
      editApplicaion,
      openConfirmCancel,
      showModal,
      selectedApplicationId,
      showHideCancelApplication,
      ClientIdType,
      reloadApplication,
      SINStatusEnum,
      sinValidStatus,
    };
  },
};
</script>
