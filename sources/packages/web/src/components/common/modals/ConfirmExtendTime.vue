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
import { useModalDialog, useAuth } from "@/composables";
import { ref } from "vue";
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
  setup(props: any) {
    const { resolvePromise, showModal } = useModalDialog<boolean>();
    const interval = ref();
    const { executeLogout } = useAuth();

    const logoff = async () => {
      await executeLogout(props.clientIdType);
    };

    const dialogClosed = () => {
      clearInterval(interval.value);
      logoff();
      resolvePromise(false);
    };

    const extendTime = async () => {
      clearInterval(interval.value);
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
