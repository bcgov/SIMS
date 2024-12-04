<template>
  <modal-dialog-base
    title="Apply for disability status"
    :showDialog="showDialog"
  >
    <template v-slot:content>
      <p class="mt-4">
        If you are a student with a permanent disability, or persistent or
        prolonged disability, you may be eligible for disability grants and
        bursaries. You will need to submit an Appendix 8 form to apply for
        disability status. You can find more information on the Appendix 8 and
        the application process
        <a
          rel="noopener"
          target="_blank"
          class="formio-href"
          href="https://studentaidbc.ca/sites/all/files/form-library/appendix_8-parttime.pdf"
          >here</a
        >.
      </p>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Close"
        @primaryClick="resolvePromise(false)"
        :showSecondaryButton="false"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<boolean>();

    return {
      resolvePromise,
      showDialog,
      showModal,
    };
  },
});
</script>
