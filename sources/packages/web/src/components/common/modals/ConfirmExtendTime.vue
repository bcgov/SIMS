<template>
  <modal-dialog-base
    title="Confirm Extend Time"
    dialogType="warning"
    :showDialog="showDialog"
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
        @primaryClick="resolvePromise(true)"
        @secondaryClick="resolvePromise(false)"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";

export default {
  components: {
    ModalDialogBase,
  },
  props: {
    countdown: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const { resolvePromise, showModal, showDialog } = useModalDialog<boolean>();

    return {
      showModal,
      resolvePromise,
      showDialog,
    };
  },
};
</script>
