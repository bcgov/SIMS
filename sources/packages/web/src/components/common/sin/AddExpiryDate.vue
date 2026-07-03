<template>
  <v-form ref="addExpiryDateForm">
    <modal-dialog-base title="Add expiry date" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="addExpiryDateForm.errors" />
        <div class="pb-2">
          <span class="label-value"
            >Enter a date that the SIN will expiry on. Please note you will not
            be able to change this.</span
          >
        </div>
        <v-date-input
          label="Expiry date"
          class="mt-2"
          variant="outlined"
          :input-format="DATE_ONLY_ISO_FORMAT"
          prepend-icon=""
          append-inner-icon="mdi-calendar"
          v-model="expiryDate"
          :rules="[
            (value: Date) => checkFutureDateRule(value, 'Expiry date'),
          ]" />
        <v-textarea
          hide-details="auto"
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[checkNotesLengthRule]"
      /></template>
      <template #footer>
        <check-permission-role :role="Role.StudentAddSINExpiry">
          <template #="{ notAllowed }">
            <footer-buttons
              primary-label="Add expiry date now"
              @secondary-click="cancel"
              @primary-click="submit"
              :disable-primary-button="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import {
  DATE_ONLY_ISO_FORMAT,
  useFormatters,
  useModalDialog,
  useRules,
} from "@/composables";
import { Role, VForm } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { UpdateSINValidationAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { checkNotesLengthRule, checkFutureDateRule } = useRules();
    const { getISODateOnlyString } = useFormatters();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      UpdateSINValidationAPIInDTO | boolean
    >();
    const addExpiryDateForm = ref({} as VForm);
    const expiryDate = ref<Date>();
    const formModel = reactive({} as UpdateSINValidationAPIInDTO);

    const submit = async () => {
      const validationResult = await addExpiryDateForm.value.validate();
      if (!validationResult.valid || !expiryDate.value) {
        return;
      }
      formModel.expiryDate = getISODateOnlyString(expiryDate.value);
      // Copying the payload, as reset is making the formModel properties null.
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
      expiryDate,
      checkNotesLengthRule,
      checkFutureDateRule,
      DATE_ONLY_ISO_FORMAT,
    };
  },
});
</script>
