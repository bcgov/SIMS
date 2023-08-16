<template>
  <modal-dialog-base
    :showDialog="showDialog"
    title="Are you sure you want to decline the change?"
  >
    <template #content>
      <p>
        The request for change in your application from your institution will
        not move forward. Are you sure you want to decline it?
      </p>
    </template>
    <template #footer>
      <footer-buttons
        primaryLabel="Decline now"
        @secondaryClick="cancel"
        @primaryClick="declineChange"
      />
    </template>
  </modal-dialog-base>
</template>
<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ref, defineComponent } from "vue";
import { useModalDialog } from "@/composables";
import { UpdateApplicationOfferingChangeRequestAPIInDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus } from "@/types";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      UpdateApplicationOfferingChangeRequestAPIInDTO | boolean
    >();
    const declineApplicationOfferingChangeRequestModal = ref(
      {} as UpdateApplicationOfferingChangeRequestAPIInDTO,
    );
    const cancel = () => {
      resolvePromise(false);
    };
    const declineChange = async () => {
      declineApplicationOfferingChangeRequestModal.value.applicationOfferingChangeRequestStatus =
        ApplicationOfferingChangeRequestStatus.DeclinedByStudent;
      resolvePromise(declineApplicationOfferingChangeRequestModal.value);
    };
    return {
      showDialog,
      showModal,
      cancel,
      declineChange,
      declineApplicationOfferingChangeRequestModal,
    };
  },
});
</script>
