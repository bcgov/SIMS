<template>
  <modal-dialog-base title="Edit application" :showDialog="showDialog">
    <template #content v-if="isBeforeApplicationEdit">
      Any edits made to your application may require the resubmission of
      supporting information, potentially delaying your application. Are you
      sure you want to proceed?
    </template>
    <template #content v-else>
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
        v-if="endDate !== '' && dayjs(endDate).diff(dayjs(), 'day') < 42"
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
        :disablePrimaryButton="!isBeforeApplicationEdit && !conditionsAccepted"
        :primaryLabel="isBeforeApplicationEdit ? 'Edit application' : 'Submit'"
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
import dayjs from "dayjs";

export default defineComponent({
  props: {
    isBeforeApplicationEdit: {
      type: Boolean,
      required: false,
      default: false,
    },
    endDate: {
      type: String,
      required: false,
      default: "",
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
      dayjs,
    };
  },
});
</script>
