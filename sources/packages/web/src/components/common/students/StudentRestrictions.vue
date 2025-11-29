<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header title="All restrictions">
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
        message="No restrictions found."
      >
        <v-data-table
          :headers="StudentRestrictionsHeaders"
          :items="studentRestrictions"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.restrictionCategory`]="{ item }">
            {{ item.restrictionCategory }}
          </template>
          <template #[`item.description`]="{ item }">
            {{ item.restrictionCode }} - {{ item.description }}
          </template>
          <template #[`item.createdAt`]="{ item }">
            {{ dateOnlyLongString(item.createdAt) }}
          </template>
          <template #[`item.updatedAt`]="{ item }">
            {{ item.isActive ? "-" : dateOnlyLongString(item.resolvedAt) }}
          </template>
          <template #[`item.isActive`]="{ item }">
            <status-chip-restriction
              :is-active="item.isActive"
              :deleted-at="item.deletedAt"
            />
          </template>
          <template #[`item.restrictionId`]="{ item }">
            <div class="d-flex">
              <v-btn
                color="primary"
                variant="outlined"
                class="mr-2"
                @click="viewStudentRestriction(item.restrictionId)"
                >View</v-btn
              >
              <check-permission-role
                :role="Role.StudentDeleteRestriction"
                v-if="
                  canDeleteRestriction &&
                  item.restrictionType === RestrictionType.Provincial
                "
              >
                <template #="{ notAllowed }">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    :disabled="notAllowed || !!item.deletedAt"
                    @click="deleteStudentRestriction(item.restrictionId)"
                    >Delete</v-btn
                  ></template
                ></check-permission-role
              >
            </div>
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
    <view-restriction-modal
      ref="viewRestriction"
      :restriction-data="studentRestriction"
      :allowed-role="Role.StudentResolveRestriction"
      :can-resolve-restriction="canResolveRestriction"
    />
    <add-student-restriction-modal
      v-if="canAddRestrictions"
      ref="addRestriction"
      :entity-type="RestrictionEntityType.Student"
      :allowed-role="Role.StudentAddRestriction"
    />
    <user-note-confirm-modal
      title="Delete restriction"
      ref="deleteRestriction"
      ok-label="Delete restriction"
    >
      <template #content>
        <p>
          <strong>Attention:</strong> You are about to delete this restriction.
          Once deleted, the restriction will not be accounted for in student's
          restrictions history. If you need to maintain a record of the
          restriction, please exit this screen and choose
          <strong>Resolve restriction</strong>
          instead.
        </p>
      </template>
      ></user-note-confirm-modal
    >
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddStudentRestrictionModal from "@/components/common/restriction/AddRestriction.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  RestrictionStatus,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  RestrictionEntityType,
  LayoutTemplates,
  Role,
  ApiProcessError,
  RestrictionType,
  StudentRestrictionsHeaders,
} from "@/types";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
} from "@/services/http/dto";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";

const { emptyStringFiller, conditionalEmptyStringFiller } = useFormatters();

export default defineComponent({
  components: {
    StatusChipRestriction,
    ViewRestrictionModal,
    AddStudentRestrictionModal,
    CheckPermissionRole,
    UserNoteConfirmModal,
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
    canDeleteRestriction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const studentRestrictions = ref<RestrictionSummaryAPIOutDTO[]>([]);
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref(
      {} as ModalDialog<RestrictionDetailAPIOutDTO | boolean>,
    );
    const addRestriction = ref(
      {} as ModalDialog<AssignRestrictionAPIInDTO | boolean>,
    );
    const deleteRestriction = ref({} as ModalDialog<UserNoteModal<number>>);
    const studentRestriction = ref();
    const snackBar = useSnackBar();
    const { mobile: isMobile } = useDisplay();

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

    const deleteStudentRestriction = async (restrictionId: number) => {
      await deleteRestriction.value.showModal(
        restrictionId,
        deleteStudentRestrictionCall,
      );
    };

    const deleteStudentRestrictionCall = async (
      userNoteModalResult: UserNoteModal<number>,
    ): Promise<boolean> => {
      try {
        await RestrictionService.shared.deleteStudentProvincialRestriction(
          props.studentId,
          userNoteModalResult.showParameter,
          { noteDescription: userNoteModalResult.note },
        );
        snackBar.success("Restriction deleted.");
        await loadStudentRestrictions();
        return true;
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
          return false;
        }
        snackBar.error(
          "An unexpected error happened while deleting the restriction.",
        );
      }
      return false;
    };

    onMounted(async () => {
      await loadStudentRestrictions();
    });

    return {
      dateOnlyLongString,
      studentRestrictions,
      RestrictionStatus,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      studentRestriction,
      viewStudentRestriction,
      deleteRestriction,
      viewRestriction,
      showModal,
      addRestriction,
      addStudentRestriction,
      deleteStudentRestriction,
      RestrictionEntityType,
      LayoutTemplates,
      Role,
      emptyStringFiller,
      conditionalEmptyStringFiller,
      RestrictionType,
      StudentRestrictionsHeaders,
      isMobile,
    };
  },
});
</script>
