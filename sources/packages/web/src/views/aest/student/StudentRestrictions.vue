<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <v-row class="m-2">
          <v-col class="category-header-medium color-blue"
            >All Restrictions</v-col
          >
          <v-col
            ><v-btn
              @click="addStudentRestriction"
              class="float-right primary-btn-background"
              ><font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />Add
              restriction</v-btn
            ></v-col
          >
        </v-row>
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
          <Column field="description" header="Reason"></Column>
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
              <StatusBadge
                :status="
                  slotProps.data.isActive
                    ? GeneralStatusForBadge.ActiveRestriction
                    : GeneralStatusForBadge.ResolvedRestriction
                "
              />
            </template>
          </Column>
          <!-- TODO: the color attribute has to come from either global constant or styling needs to be added to added. -->
          <Column field="restrictionId" header="">
            <template #body="slotProps">
              <v-btn
                color="#2965c5"
                outlined
                @click="viewStudentRestriction(slotProps.data.restrictionId)"
                >View</v-btn
              >
            </template></Column
          >
        </DataTable>
      </content-group>
    </div>
  </v-card>
  <ViewRestrictionModal
    ref="viewRestriction"
    :studentRestriction="studentRestriction"
    @submitResolutionData="resolveRestriction"
  />
  <AddStudentRestrictionModal
    ref="addRestriction"
    :studentRestriction="studentRestriction"
    @submitRestrictionData="createNewRestriction"
  />
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/views/aest/student/ViewStudentRestriction.vue";
import AddStudentRestrictionModal from "@/views/aest/student/AddStudentRestriction.vue";
import { useFormatters, ModalDialog, useToastMessage } from "@/composables";
import {
  GeneralStatusForBadge,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  AddStudentRestrictionDTO,
  StudentRestrictionDetail,
  UpdateRestrictionDTO,
} from "@/types";
import StatusBadge from "@/components/generic/StatusBadge.vue";

export default {
  components: {
    ContentGroup,
    StatusBadge,
    ViewRestrictionModal,
    AddStudentRestrictionModal,
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
    const toast = useToastMessage();

    const loadStudentRestrictions = async () => {
      studentRestrictions.value = await RestrictionService.shared.getStudentRestrictions(
        props.studentId,
      );
    };

    const viewStudentRestriction = async (restrictionId: number) => {
      studentRestriction.value = await RestrictionService.shared.getStudentRestrictionDetail(
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

    const resolveRestriction = async (data: StudentRestrictionDetail) => {
      try {
        const payload = {
          noteDescription: data.resolutionNote,
        } as UpdateRestrictionDTO;
        await RestrictionService.shared.resolveStudentRestriction(
          props.studentId,
          data.restrictionId,
          payload,
        );
        await loadStudentRestrictions();
        toast.success(
          "Restriction Resolved",
          "The given restriction has been resolved and resolution notes added.",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while resolving the restriction.",
        );
      }
    };

    const addStudentRestriction = async () => {
      await addRestriction.value.showModal();
    };

    const createNewRestriction = async (data: AddStudentRestrictionDTO) => {
      try {
        await RestrictionService.shared.addStudentRestriction(
          props.studentId,
          data,
        );
        await loadStudentRestrictions();
        toast.success(
          "Restriction Added",
          "The restriction has been added to student.",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while adding the restriction.",
        );
      }
    };

    onMounted(async () => {
      await loadStudentRestrictions();
    });
    return {
      dateOnlyLongString,
      studentRestrictions,
      GeneralStatusForBadge,
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
    };
  },
};
</script>
