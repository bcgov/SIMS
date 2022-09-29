<template>
  <v-form ref="addExpiryDateForm">
    <modal-dialog-base
      title="Add expiry date"
      :showDialog="showDialog"
      max-width="730"
    >
      <template #content>
        <error-summary :errors="addExpiryDateForm.errors" />
        <div class="pb-2">
          <span class="label-value"
            >Enter a date that the SIN will expiry on. Please note you will not
            be able to change this.</span
          >
        </div>
        <!-- TODO Date picker is not available in the vuetify 3 version, so temporary usage of textfield and regex-->
        <v-text-field
          label="Expiry date"
          class="mt-2"
          placeholder="yyyy-MM-dd"
          v-model="formModel.expiryDate"
          variant="outlined"
          :rules="[
            (v) =>
              v.match(/^\d{4}-\d{2}-\d{2}$/) ||
              'Expiry end date is not in right format',
          ]" />
        <v-textarea
          hide-details
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[(v) => !!v || 'Notes is required']"
      /></template>
      <template #footer>
        <check-permission-role :role="Role.StudentAddSINExpiry">
          <template #="{ notAllowed }">
            <footer-buttons
              justify="end"
              primaryLabel="Add expiry date now"
              @secondaryClick="cancel"
              @primaryClick="submit"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, reactive } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog } from "@/composables";
import { Role, VForm } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { UpdateSINValidationAPIInDTO } from "@/services/http/dto";

export default {
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    entityType: {
      type: String,
      required: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      UpdateSINValidationAPIInDTO | boolean
    >();
    const addExpiryDateForm = ref({} as VForm);
    const formModel = reactive({} as UpdateSINValidationAPIInDTO);

    const submit = async () => {
      const validationResult = await addExpiryDateForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload = { ...formModel };
      resolvePromise(payload);
      addExpiryDateForm.value.reset();
    };

    const cancel = () => {
      addExpiryDateForm.value.reset();
      addExpiryDateForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      Role,
      addExpiryDateForm,
      formModel,
    };
  },
};
</script>
