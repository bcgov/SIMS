<template>
  <title-value property-title="Modified independent status">
    <template #value
      >{{ modifiedIndependentDisplayStatus }}
      <v-btn
        class="p-1"
        density="compact"
        v-if="allowUpdateActions"
        variant="text"
        color="primary"
        @click="showModifiedIndependentStatusModal"
        ><span class="text-decoration-underline font-bold"
          >Update modified independent status</span
        ></v-btn
      ></template
    >
  </title-value>
  <update-modified-independent-status-modal
    ref="updateModifiedIndependentStatusModal"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import { ApiProcessError, ModifiedIndependentStatus } from "@/types";
import UpdateModifiedIndependentStatusModal from "@/components/aest/students/modals/UpdateModifiedIndependentStatusModal.vue";
import { UpdateModifiedIndependentStatusAPIInDTO } from "@/services/http/dto";
import { StudentService } from "@/services/StudentService";
import { MODIFIED_INDEPENDENT_STATUS_NOT_UPDATED } from "@/constants";

export default defineComponent({
  emits: {
    modifiedIndependentStatusUpdated: null,
  },
  components: { UpdateModifiedIndependentStatusModal },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    modifiedIndependentStatus: {
      type: String as PropType<ModifiedIndependentStatus>,
      required: true,
    },
    allowUpdateActions: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const { modifiedIndependentStatusToDisplay } = useFormatters();
    const modifiedIndependentDisplayStatus = computed(() =>
      modifiedIndependentStatusToDisplay(props.modifiedIndependentStatus),
    );
    const updateModifiedIndependentStatusModal = ref(
      {} as ModalDialog<UpdateModifiedIndependentStatusAPIInDTO>,
    );

    const showModifiedIndependentStatusModal = async () => {
      await updateModifiedIndependentStatusModal.value.showModal(
        undefined,
        updateModifiedIndependentStatus,
      );
    };

    const updateModifiedIndependentStatus = async (
      payload: UpdateModifiedIndependentStatusAPIInDTO,
    ): Promise<boolean> => {
      try {
        await StudentService.shared.updateModifiedIndependentStatus(
          props.studentId,
          payload,
        );
        snackBar.success("Modified independent status updated successfully.");
        emit("modifiedIndependentStatusUpdated");
        return true;
      } catch (error) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === MODIFIED_INDEPENDENT_STATUS_NOT_UPDATED
        ) {
          snackBar.warn(error.message);
          return false;
        }
        snackBar.error(
          "Unexpected error while updating modified independent status.",
        );
        return false;
      }
    };

    return {
      modifiedIndependentDisplayStatus,
      updateModifiedIndependentStatusModal,
      showModifiedIndependentStatusModal,
    };
  },
});
</script>
