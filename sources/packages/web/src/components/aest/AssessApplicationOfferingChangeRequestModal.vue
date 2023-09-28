<template>
  <v-form ref="assessApplicationOfferingChangeRequestForm">
    <modal-dialog-base
      :showDialog="showDialog"
      :title="getTitle"
      :max-width="780"
    >
      <template #content
        ><error-summary
          :errors="assessApplicationOfferingChangeRequestForm.errors"
        />
        <p class="my-4">
          Outline the reasoning for
          <span
            v-if="
              showParameter ===
              ApplicationOfferingChangeRequestStatus.DeclinedBySABC
            "
            >declining</span
          ><span v-else>approving</span>
          this request. Please add the application number.
        </p>
        <p class="label-bold mb-1">Notes</p>
        <v-textarea
          variant="outlined"
          hide-details="auto"
          v-model="note"
          :rules="[checkNotesLengthRule]"
          required
        />
        <p class="pt-1 brand-gray-text">
          Notes will be visible to StudentAid staff and institutions. This will
          not be shown to students.
        </p>
      </template>
      <template #footer>
        <footer-buttons
          :primaryLabel="getPrimaryLabel"
          @secondaryClick="cancel"
          @primaryClick="assessChange"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ref, defineComponent, computed } from "vue";
import { useModalDialog, useRules } from "@/composables";
import { ApplicationOfferingChangeAssessmentAPIInDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus, VForm } from "@/types";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const note = ref("");
    const { showDialog, showModal, resolvePromise, showParameter } =
      useModalDialog<ApplicationOfferingChangeAssessmentAPIInDTO | boolean>();
    const assessApplicationOfferingChangeRequestModal = ref(
      {} as ApplicationOfferingChangeAssessmentAPIInDTO,
    );
    const assessApplicationOfferingChangeRequestForm = ref({} as VForm);
    const { checkNotesLengthRule } = useRules();
    const getTitle = computed(() =>
      showParameter.value ===
      ApplicationOfferingChangeRequestStatus.DeclinedBySABC
        ? "Decline for reassessment"
        : "Approve for reassessment",
    );
    const getPrimaryLabel = computed(() =>
      showParameter.value ===
      ApplicationOfferingChangeRequestStatus.DeclinedBySABC
        ? "Decline now"
        : "Approve now",
    );
    const cancel = () => {
      assessApplicationOfferingChangeRequestForm.value.reset();
      assessApplicationOfferingChangeRequestForm.value.resetValidation();
      resolvePromise(false);
    };
    const assessChange = async () => {
      const validationResult =
        await assessApplicationOfferingChangeRequestForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      if (
        showParameter.value ===
        ApplicationOfferingChangeRequestStatus.DeclinedBySABC
      ) {
        assessApplicationOfferingChangeRequestModal.value.applicationOfferingChangeRequestStatus =
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC;
      } else {
        assessApplicationOfferingChangeRequestModal.value.applicationOfferingChangeRequestStatus =
          ApplicationOfferingChangeRequestStatus.Approved;
      }
      assessApplicationOfferingChangeRequestModal.value.note = note.value;
      resolvePromise(assessApplicationOfferingChangeRequestModal.value);
      assessApplicationOfferingChangeRequestForm.value.reset();
    };
    return {
      showDialog,
      showModal,
      showParameter,
      cancel,
      assessChange,
      note,
      getTitle,
      getPrimaryLabel,
      checkNotesLengthRule,
      ApplicationOfferingChangeRequestStatus,
      assessApplicationOfferingChangeRequestForm,
      assessApplicationOfferingChangeRequestModal,
    };
  },
});
</script>
