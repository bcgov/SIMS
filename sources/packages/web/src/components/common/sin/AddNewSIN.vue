<template>
  <v-form ref="addNewSINForm">
    <modal-dialog-base
      title="Add a new SIN"
      :showDialog="showDialog"
      max-width="730"
    >
      <template #content>
        <error-summary :errors="addNewSINForm.errors" />
        <div class="pb-2">
          <span class="label-value"
            >Enter a new SIN for the student. The SIN will be validated with
            Employment and Social Development Canada (ESDC) unless you skip the
            validations.</span
          >
        </div>
        <v-text-field
          hide-details
          label="Social Insurance Number (SIN)"
          v-model="formModel.sin"
          variant="outlined"
          :rules="[(v) => !!v || 'SIN is required']" />
        <v-checkbox
          label="Skip the validations"
          v-model="formModel.skipValidations"
          hide-details />
        <v-textarea
          hide-details
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[(v) => !!v || 'Notes is required']"
      /></template>
      <template #footer>
        <check-permission-role :role="Role.StudentAddNewSIN">
          <template #="{ notAllowed }">
            <footer-buttons
              justify="end"
              primaryLabel="Add SIN now"
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
import { CreateSINValidationAPIInDTO } from "@/services/http/dto";

export const CATEGORY_KEY = "category";
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
      CreateSINValidationAPIInDTO | false
    >();
    const addNewSINForm = ref({} as VForm);
    const formModel = reactive({} as CreateSINValidationAPIInDTO);

    const submit = async () => {
      const validationResult = await addNewSINForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload = { ...formModel };
      resolvePromise(payload);
      addNewSINForm.value.reset();
    };

    const cancel = () => {
      addNewSINForm.value.reset();
      addNewSINForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      Role,
      addNewSINForm,
      formModel,
    };
  },
};
</script>
