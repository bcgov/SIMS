<template>
  <v-form ref="approveProgramForm">
    <modal-dialog-base title="Approve program" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="approveProgramForm.errors" />
        <div class="pb-2">
          <span class="label-value"
            >Please select the expiry date for the program</span
          >
        </div>
        <v-date-input
          label="Expiry date"
          class="mt-2"
          variant="outlined"
          :input-format="DATE_ONLY_ISO_FORMAT"
          prepend-icon=""
          append-inner-icon="mdi-calendar"
          v-model="effectiveEndDate"
          :rules="[(value: Date) => checkFutureDateRule(value, 'Expiry date')]"
        />
        <div class="pb-2">
          <span class="label-value"
            >Outline the reasoning for approving this program. This will be
            stored in the institution profile notes.</span
          >
        </div>
        <v-textarea
          label="Notes"
          placeholder="Describe the reasoning for approving this program..."
          v-model="formModel.approvedNote"
          variant="outlined"
          :rules="[checkNotesLengthRule]"
          hide-details="auto"
        />
      </template>
      <template #footer>
        <check-permission-role :role="Role.InstitutionApproveDeclineProgram">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primary-label="Approve now"
              @primary-click="submit"
              @secondary-click="cancel"
              :disable-primary-button="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { computed, ref, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import {
  DATE_ONLY_ISO_FORMAT,
  useFormatters,
  useModalDialog,
  useRules,
} from "@/composables";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { ApproveProgramAPIInDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role, VForm } from "@/types";

export default defineComponent({
  components: {
    ModalDialogBase,
    CheckPermissionRole,
    ErrorSummary,
  },
  props: {
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup() {
    const { checkNotesLengthRule, checkFutureDateRule } = useRules();
    const { getISODateOnlyString, dateOnlyToLocalDateTimeString } =
      useFormatters();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      ApproveProgramAPIInDTO | boolean
    >();
    const approveProgramForm = ref({} as VForm);
    const formModel = reactive({
      effectiveEndDate: "",
      approvedNote: "",
    } as ApproveProgramAPIInDTO);
    // Two-way binding between the v-date-input (Date) and the string date
    // stored in the form model, keeping the model as the single source of truth.
    const effectiveEndDate = computed<Date | undefined>({
      get: () =>
        formModel.effectiveEndDate
          ? new Date(dateOnlyToLocalDateTimeString(formModel.effectiveEndDate))
          : undefined,
      set: (value) => {
        formModel.effectiveEndDate = value ? getISODateOnlyString(value) : "";
      },
    });

    const submit = async () => {
      const validationResult = await approveProgramForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise(formModel);
    };

    // Closed the modal dialog.
    const cancel = () => {
      approveProgramForm.value.reset();
      approveProgramForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      submit,
      showModal,
      cancel,
      formModel,
      effectiveEndDate,
      approveProgramForm,
      Role,
      checkNotesLengthRule,
      checkFutureDateRule,
      DATE_ONLY_ISO_FORMAT,
    };
  },
});
</script>
