<template>
  <confirm-modal
    title="Edit application"
    ref="editApplicationModal"
    okLabel="Submit"
    cancelLabel="No"
    :disable-primary-button="!conditionsAccepted"
    ><template #content>
      <div class="m-4">
        <v-checkbox
          color="primary"
          v-model="conditionsAccepted"
          label="I acknowledge that by editing my application, I may be required to
        resubmit previously approved exception requests. My institution may be
        required to resubmit program information, and my parent or partner may be
        required to resubmit supporting information."
          hide-details="auto"
        ></v-checkbox>
      </div>
      <div class="m-4">
        <banner v-if="isStudyEndDateWithinDeadline" :type="BannerTypes.Warning">
          <template #content
            >Please note your application has now passed the six week deadline
            for completed applications to be received by StudentAid BC. All
            edits to your application will require additional review from
            StudentAid BC to be considered for funding. Please see the following
            link for information on the
            <a
              rel="noopener"
              target="_blank"
              href="https://studentaidbc.ca/sites/all/files/form-library/appeal_fundingafterenddate.pdf"
              >funding after end date appeal</a
            >.
          </template>
        </banner>
      </div>
    </template></confirm-modal
  >
</template>

<script lang="ts">
import { useModalDialog } from "@/composables";
import { BannerTypes } from "@/types";
import { defineComponent, ref } from "vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";

export default defineComponent({
  props: {
    isStudyEndDateWithinDeadline: {
      type: Boolean,
      required: true,
    },
  },
  components: {
    ConfirmModal,
  },

  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const dialogClosed = () => {
      conditionsAccepted.value = false;
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
