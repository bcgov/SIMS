<template>
  <modal-dialog-base
    title="Apply for disability status"
    :show-dialog="showDialog"
  >
    <template #content>
      <p>To apply for disability status please follow these instructions:</p>
      <ul>
        <li>
          Download the
          <a
            rel="noopener"
            target="_blank"
            class="formio-href"
            href="https://studentaidbc.ca/sites/all/files/form-library/disability-verification.pdf"
            >Disability Verification Form</a
          >
          and take it to a qualified medical assessor for completion.
        </li>
        <li>
          Visit the Forms area near the top right of your Student Account main
          page.
        </li>
        <li>
          Select Student Forms > Standard Forms > Disability status application.
        </li>
        <li>
          Upload the completed form to the Upload supporting documents area
          within the Disability status application.
        </li>
        <li>
          Complete your Declaration and submit your Disability status
          application for review.
        </li>
      </ul>
    </template>
    <template #footer>
      <footer-buttons
        primary-label="Close"
        @primary-click="resolvePromise(false)"
        :show-secondary-button="false"
      />
    </template>
  </modal-dialog-base>
</template>

<script setup lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";

const { showDialog, showModal, resolvePromise } = useModalDialog<boolean>();

defineExpose({
  resolvePromise,
  showDialog,
  showModal,
});
</script>
