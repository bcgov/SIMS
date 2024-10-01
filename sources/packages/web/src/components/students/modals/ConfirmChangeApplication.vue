<template>
  <modal-dialog-base title="Edit application" :showDialog="showDialog">
    <template #content>
      <v-checkbox
        v-model="conditionsAccepted"
        label="I acknowledge that by editing my application, I may be required to
        resubmit previously approved exception requests. My institution may be
        required to resubmit program information, and my parent or partner may be
        required to resubmit supporting information."
        hide-details="auto"
      ></v-checkbox>
      <banner
        class="mb-4"
        v-if="!isStudentEndDateWithinDeadline"
        :type="BannerTypes.Warning"
      >
        <template #content
          >Please note your application has now passed the six week deadline for
          completed applications to be received by StudentAid BC. All edits to
          your application will require additional review from StudentAid BC to
          be considered for funding. Please see the following link for
          information on the
          <a
            rel="noopener"
            target="_blank"
            href="https://studentaidbc.ca/sites/all/files/form-library/appeal_fundingafterenddate.pdf"
            >funding after end date appeal</a
          >.
        </template>
      </banner>
    </template>
    <template #footer>
      <footer-buttons
        :disablePrimaryButton="!conditionsAccepted"
        primaryLabel="Submit"
        secondaryLabel="No"
        @primaryClick="editApplication"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { BannerTypes } from "@/types";
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    isStudentEndDateWithinDeadline: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const dialogClosed = () => {
      resolvePromise(false);
    };
    const editApplication = async () => {
      resolvePromise(true);
    };
    const conditionsAccepted = ref(false);

    return {
      showDialog,
      showModal,
      dialogClosed,
      editApplication,
      conditionsAccepted,
      BannerTypes,
    };
  },
});
</script>
