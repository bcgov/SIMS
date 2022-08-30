<template>
  <full-page-container :full-width="true">
    <body-header title="All restrictions" class="m-1">
      <template #actions>
        <check-permission-role :role="Role.StudentAddRestriction">
          <template #="{ notAllowed }">
            <v-btn
              @click="addStudentRestriction"
              class="float-right"
              color="primary"
              data-cy="addRestrictionButton"
              prepend-icon="fa:fa fa-plus-circle"
              :disabled="notAllowed"
              >Add restriction</v-btn
            >
          </template>
        </check-permission-role>
      </template>
    </body-header>
    <content-group>
      <DataTable
        :value="studentRestrictions"
        :paginator="true"
        :rows="DEFAULT_PAGE_LIMIT"
        :rowsPerPageOptions="PAGINATION_LIST"
      >
        <template #empty>
          <p class="text-center font-weight-bold">No records found.</p>
        </template>
        <Column
          field="restrictionCategory"
          header="Category"
          sortable="true"
        ></Column>
        <Column field="description" header="Reason">
          <template #body="slotProps">{{
            `${slotProps.data.restrictionCode} - ${slotProps.data.description}`
          }}</template></Column
        >
        <Column field="createdAt" header="Added"
          ><template #body="slotProps">{{
            dateOnlyLongString(slotProps.data.createdAt)
          }}</template></Column
        >
        <Column field="updatedAt" header="Resolved">
          <template #body="slotProps">{{
            slotProps.data.isActive
              ? "-"
              : dateOnlyLongString(slotProps.data.updatedAt)
          }}</template></Column
        >
        <Column field="isActive" header="Status">
          <template #body="slotProps">
            <status-chip-restriction
              :status="
                slotProps.data.isActive
                  ? RestrictionStatus.Active
                  : RestrictionStatus.Resolved
              "
            />
          </template>
        </Column>
        <Column field="restrictionId" header="">
          <template #body="slotProps">
            <v-btn
              color="primary"
              variant="outlined"
              @click="viewStudentRestriction(slotProps.data.restrictionId)"
              >View</v-btn
            >
          </template></Column
        >
      </DataTable>
    </content-group>
  </full-page-container>
  <ViewRestrictionModal
    ref="viewRestriction"
    :restrictionData="studentRestriction"
    @submitResolutionData="resolveRestriction"
    :allowedRole="Role.StudentResolveRestriction"
  />
  <AddStudentRestrictionModal
    ref="addRestriction"
    :entityType="RestrictionEntityType.Student"
    @submitRestrictionData="createNewRestriction"
    :allowedRole="Role.StudentAddRestriction"
  />
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddStudentRestrictionModal from "@/components/common/restriction/AddRestriction.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  RestrictionStatus,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  RestrictionEntityType,
  LayoutTemplates,
  Role,
} from "@/types";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
} from "@/services/http/dto";

export default {
  components: {
    StatusChipRestriction,
    ViewRestrictionModal,
    AddStudentRestrictionModal,
    CheckPermissionRole,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const studentRestrictions = ref();
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref({} as ModalDialog<void>);
    const addRestriction = ref({} as ModalDialog<void>);
    const studentRestriction = ref();
    const snackBar = useSnackBar();

    const loadStudentRestrictions = async () => {
      studentRestrictions.value =
        await RestrictionService.shared.getStudentRestrictions(props.studentId);
    };

    const viewStudentRestriction = async (restrictionId: number) => {
      studentRestriction.value =
        await RestrictionService.shared.getStudentRestrictionDetail(
          props.studentId,
          restrictionId,
        );
      studentRestriction.value.createdAt = dateOnlyLongString(
        studentRestriction.value.createdAt,
      );
      if (studentRestriction.value.updatedAt) {
        studentRestriction.value.updatedAt = dateOnlyLongString(
          studentRestriction.value.updatedAt,
        );
      }

      await viewRestriction.value.showModal();
    };

    const resolveRestriction = async (data: RestrictionDetailAPIOutDTO) => {
      try {
        const payload = {
          noteDescription: data.resolutionNote,
        } as ResolveRestrictionAPIInDTO;
        await RestrictionService.shared.resolveStudentRestriction(
          props.studentId,
          data.restrictionId,
          payload,
        );
        await loadStudentRestrictions();
        snackBar.success(
          "The given restriction has been resolved and resolution notes added.",
        );
      } catch (error) {
        snackBar.error("Unexpected error while resolving the restriction.");
      }
    };

    const addStudentRestriction = async () => {
      await addRestriction.value.showModal();
    };

    const createNewRestriction = async (data: AssignRestrictionAPIInDTO) => {
      try {
        await RestrictionService.shared.addStudentRestriction(
          props.studentId,
          data,
        );
        await loadStudentRestrictions();
        snackBar.success("The restriction has been added to student.");
      } catch (error) {
        snackBar.error("Unexpected error while adding the restriction.");
      }
    };

    onMounted(async () => {
      await loadStudentRestrictions();
    });
    return {
      dateOnlyLongString,
      studentRestrictions,
      RestrictionStatus,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      studentRestriction,
      viewStudentRestriction,
      viewRestriction,
      showModal,
      resolveRestriction,
      addRestriction,
      addStudentRestriction,
      createNewRestriction,
      RestrictionEntityType,
      LayoutTemplates,
      Role,
    };
  },
};
</script>
