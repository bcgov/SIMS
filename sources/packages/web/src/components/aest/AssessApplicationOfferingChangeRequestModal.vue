<template>
  <v-form ref="assessApplicationOfferingChangeRequestForm">
    <modal-dialog-base :showDialog="showDialog" :title="title">
      <template #content
        ><error-summary
          :errors="assessApplicationOfferingChangeRequestForm.errors"
        />
        <p class="my-4">
          {{ subject }}
        </p>
        <v-textarea
          label="Notes"
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
        <check-permission-role
          :role="Role.InstitutionApproveDeclineApplicationOfferingChangeRequest"
        >
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              :primaryLabel="primaryLabel"
              @secondaryClick="cancel"
              @primaryClick="assessChange"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ref, defineComponent, computed } from "vue";
import { useModalDialog, useRules } from "@/composables";
import { ApplicationOfferingChangeAssessmentAPIInDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus, VForm, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    CheckPermissionRole,
  },
  props: {
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup() {
    const note = ref("");
    const {
      showDialog,
      showModal,
      resolvePromise,
      showParameter,
      hideModal,
      setLoading,
      loading,
    } = useModalDialog<ApplicationOfferingChangeAssessmentAPIInDTO | false>();
    const assessApplicationOfferingChangeRequestModal =
      {} as ApplicationOfferingChangeAssessmentAPIInDTO;
    const assessApplicationOfferingChangeRequestForm = ref({} as VForm);
    const { checkNotesLengthRule } = useRules();
    const title = computed(() =>
      showParameter.value ===
      ApplicationOfferingChangeRequestStatus.DeclinedBySABC
        ? "Decline for reassessment"
        : "Approve for reassessment",
    );
    const subject = computed(() =>
      showParameter.value === ApplicationOfferingChangeRequestStatus.Approved
        ? "Outline the reasoning for approving this request. Please add the application number."
        : "Outline the reasoning for declining this request. Please add the application number.",
    );
    const primaryLabel = computed(() =>
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
      assessApplicationOfferingChangeRequestModal.applicationOfferingChangeRequestStatus =
        showParameter.value;
      assessApplicationOfferingChangeRequestModal.note = note.value;
      resolvePromise(assessApplicationOfferingChangeRequestModal, true);
      assessApplicationOfferingChangeRequestForm.value.reset();
    };
    return {
      Role,
      showDialog,
      showModal,
      showParameter,
      hideModal,
      setLoading,
      loading,
      cancel,
      assessChange,
      note,
      title,
      subject,
      primaryLabel,
      checkNotesLengthRule,
      ApplicationOfferingChangeRequestStatus,
      assessApplicationOfferingChangeRequestForm,
    };
  },
});
</script>
