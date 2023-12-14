<template>
  <modal-dialog-base
    title="Apply for a Disability Status"
    :showDialog="showDialog"
  >
    <template v-slot:content>
      <p class="mt-4">
        StudentAid BC must verify your Disability Status to confirm your
        eligibility for federal and provincial funding for students with
        disabilities. Disability Status can be verified as either a Permanent
        Disability (PD) or a Persistent or Prolonged Disability (PPD).<br />
        If you have not verified your Disability Status before, please complete
        and submit an Appendix 8 form. You can find PD and PPD definitions,
        available disability type funding, eligibility requirements and how to
        submit your form on
        <a
          rel="noopener"
          target="_blank"
          class="formio-href"
          href="https://studentaidbc.ca/sites/all/files/form-library/appendix_8.pdf"
          >Appendix 8</a
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
