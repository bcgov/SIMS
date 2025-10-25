<template>
  <title-value property-title="Disability status">
    <template #value
      >{{ disabilityStatusToDisplay(disabilityStatus) }}
      <v-btn
        class="p-1"
        v-if="allowDisabilityStatusUpdate"
        variant="text"
        color="primary"
        @click="showDisabilityStatusModal"
        ><span class="text-decoration-underline font-bold"
          >Update disability status</span
        ></v-btn
      ></template
    >
  </title-value>
  <update-disability-status-modal
    ref="updateDisabilityStatusModal"
    :allowed-role="Role.StudentUpdateDisabilityStatus"
  />
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from "vue";
import { StudentService } from "@/services/StudentService";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import { DisabilityStatus, Role } from "@/types";
import UpdateDisabilityStatusModal from "@/components/aest/students/modals/UpdateDisabilityStatusModal.vue";
import { UpdateDisabilityStatusAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  components: { UpdateDisabilityStatusModal },
  emits: {
    disabilityStatusUpdated: null,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    disabilityStatus: {
      type: String as PropType<DisabilityStatus>,
      required: true,
    },
    allowDisabilityStatusUpdate: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const { disabilityStatusToDisplay } = useFormatters();
    const updateDisabilityStatusModal = ref(
      {} as ModalDialog<UpdateDisabilityStatusAPIInDTO | false>,
    );
    const snackBar = useSnackBar();

    const showDisabilityStatusModal = async () => {
      const updatedDisabilityStatus =
        await updateDisabilityStatusModal.value.showModal();
      if (updatedDisabilityStatus) {
        try {
          updateDisabilityStatusModal.value.loading = true;
          await StudentService.shared.updateDisabilityStatus(
            props.studentId,
            updatedDisabilityStatus,
          );
          snackBar.success("Disability status updated successfully.");
          context.emit("disabilityStatusUpdated");
          updateDisabilityStatusModal.value.hideModal();
        } catch {
          snackBar.error("An error happened while updating disability status.");
          updateDisabilityStatusModal.value.loading = false;
        }
      }
    };

    return {
      disabilityStatusToDisplay,
      Role,
      updateDisabilityStatusModal,
      showDisabilityStatusModal,
    };
  },
});
</script>
