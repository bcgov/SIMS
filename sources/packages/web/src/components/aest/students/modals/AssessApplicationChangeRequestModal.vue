<template>
  <v-form ref="assessApplicationChangeRequestForm">
    <modal-dialog-base :showDialog="showDialog" :title="title">
      <template #content
        ><error-summary :errors="assessApplicationChangeRequestForm.errors" />
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
        <check-permission-role :role="Role.StudentApproveDeclineAppeals">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="loading"
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
import { ApplicationChangeRequestAPIInDTO } from "@/services/http/dto";
import { VForm, Role, ApplicationEditStatus } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    CheckPermissionRole,
  },
  setup() {
    const note = ref<string>();
    const {
      showDialog,
      showModal,
      resolvePromise,
      showParameter,
      hideModal,
      loading,
    } = useModalDialog<ApplicationChangeRequestAPIInDTO | false>();
    const assessApplicationChangeRequestModal =
      {} as ApplicationChangeRequestAPIInDTO;
    const assessApplicationChangeRequestForm = ref({} as VForm);
    const { checkNotesLengthRule } = useRules();
    const title = computed(() =>
      showParameter.value === ApplicationEditStatus.ChangeDeclined
        ? "Decline change request"
        : "Approve change request",
    );
    const subject = computed(() =>
      showParameter.value === ApplicationEditStatus.ChangeDeclined
        ? "Outline the reasoning for declining this request. Please add the application number."
        : "Outline the reasoning for approving this request. Please add the application number.",
    );
    const primaryLabel = computed(() =>
      showParameter.value === ApplicationEditStatus.ChangeDeclined
        ? "Decline now"
        : "Approve now",
    );
    const cancel = () => {
      assessApplicationChangeRequestForm.value.reset();
      assessApplicationChangeRequestForm.value.resetValidation();
      resolvePromise(false);
    };
    const assessChange = async () => {
      const validationResult =
        await assessApplicationChangeRequestForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      assessApplicationChangeRequestModal.applicationEditStatus =
        showParameter.value;
      assessApplicationChangeRequestModal.note = note.value ?? "";
      await resolvePromise(assessApplicationChangeRequestModal, {
        keepModalOpen: true,
      });
      assessApplicationChangeRequestForm.value.reset();
    };
    return {
      Role,
      showDialog,
      showModal,
      showParameter,
      hideModal,
      loading,
      cancel,
      assessChange,
      note,
      title,
      subject,
      primaryLabel,
      checkNotesLengthRule,
      assessApplicationChangeRequestForm,
    };
  },
});
</script>
