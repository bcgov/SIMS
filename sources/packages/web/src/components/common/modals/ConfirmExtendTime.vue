<template>
  <modal-dialog-base
    title="Confirm Extend Time"
    dialogType="warning"
    :showDialog="showDialog"
    @click="extendTime"
  >
    <template v-slot:content>
      <v-container class="p-component text-dark">
        <p>
          You are about to be logged off, do you wish to extend your time?
          <v-btn class="ml-2 text-white" color="warning" icon>
            {{ countdown }}
          </v-btn>
        </p>
      </v-container>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Yes"
        secondaryLabel="No"
        @primaryClick="extendTime"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { ClientIdType } from "@/types/contracts/ConfigContract";

export default {
  components: {
    ModalDialogBase,
  },
  props: {
    clientIdType: {
      type: String,
      required: true,
      default: "" as ClientIdType,
    },
    countdown: {
      type: Number,
      required: true,
    },
    showDialog: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const { resolvePromise, showModal } = useModalDialog<boolean>();

    const dialogClosed = () => {
      resolvePromise(false);
    };

    const extendTime = async () => {
      resolvePromise(true);
    };

    return {
      showModal,
      dialogClosed,
      extendTime,
    };
  },
};
</script>
