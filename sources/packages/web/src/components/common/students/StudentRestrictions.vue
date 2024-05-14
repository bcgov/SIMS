<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header title="All restrictions" title-header-level="2">
        <template #actions v-if="canAddRestrictions">
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
    </template>
    <content-group>
      <toggle-content
        :toggled="!studentRestrictions?.length"
        message="No records found."
      >
        <DataTable
          :value="studentRestrictions"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column
            field="restrictionCategory"
            header="Category"
            :sortable="true"
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
              conditionalEmptyStringFiller(
                !slotProps.data.isActive,
                dateOnlyLongString(slotProps.data.updatedAt),
              )
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
      </toggle-content>
    </content-group>
    <view-restriction-modal
      ref="viewRestriction"
      :restrictionData="studentRestriction"
      :allowedRole="Role.StudentResolveRestriction"
      :canResolveRestriction="canResolveRestriction"
    />
    <add-student-restriction-modal
      v-if="canAddRestrictions"
      ref="addRestriction"
      :entityType="RestrictionEntityType.Student"
      :allowedRole="Role.StudentAddRestriction"
    />
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddStudentRestrictionModal from "@/components/common/restriction/AddRestriction.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
const { emptyStringFiller, conditionalEmptyStringFiller } = useFormatters();
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

export default defineComponent({
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
    canAddRestrictions: {
      type: Boolean,
      required: false,
      default: false,
    },
    canResolveRestriction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const studentRestrictions = ref();
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref(
      {} as ModalDialog<RestrictionDetailAPIOutDTO | boolean>,
    );
    const addRestriction = ref(
      {} as ModalDialog<AssignRestrictionAPIInDTO | boolean>,
    );
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
      const viewStudentRestrictionData =
        await viewRestriction.value.showModal();
      if (viewStudentRestrictionData) {
        await resolveRestriction(
          viewStudentRestrictionData as RestrictionDetailAPIOutDTO,
        );
      }
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
      } catch {
        snackBar.error("Unexpected error while resolving the restriction.");
      }
    };

    const addStudentRestriction = async () => {
      const addStudentRestrictionData = await addRestriction.value.showModal();
      if (addStudentRestrictionData) {
        await createNewRestriction(
          addStudentRestrictionData as AssignRestrictionAPIInDTO,
        );
      }
    };

    const createNewRestriction = async (data: AssignRestrictionAPIInDTO) => {
      try {
        await RestrictionService.shared.addStudentRestriction(
          props.studentId,
          data,
        );
        await loadStudentRestrictions();
        snackBar.success("The restriction has been added to student.");
      } catch {
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
      addRestriction,
      addStudentRestriction,
      RestrictionEntityType,
      LayoutTemplates,
      Role,
      emptyStringFiller,
      conditionalEmptyStringFiller,
    };
  },
});
</script>
