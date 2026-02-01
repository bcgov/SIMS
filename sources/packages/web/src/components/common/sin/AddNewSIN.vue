<template>
  <v-form ref="addNewSINForm">
    <modal-dialog-base title="Add a new SIN" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="addNewSINForm.errors" />
        <div class="pb-5">
          <span class="label-value"
            >Enter a new SIN for the student. The SIN will be validated with
            Employment and Social Development Canada (ESDC) unless you skip the
            validations.</span
          >
        </div>
        <v-text-field
          hide-details="auto"
          label="Social Insurance Number (SIN)"
          v-model="formModel.sin"
          variant="outlined"
          :rules="[sinValidationRule]" />
        <v-checkbox
          label="Skip the validations"
          v-model="formModel.skipValidations"
          hide-details="auto"
          @update:model-value="
            (value: boolean | null) => (formModel.skipValidations = !!value)
          " />
        <banner
          class="mb-4"
          v-if="formModel.skipValidations"
          :type="BannerTypes.Error"
          header="Danger! Are you sure you want to skip the validations?"
          summary="By selecting this, you are forcing the SIN to be valid for the
            student. Please proceed with caution."
        >
        </banner>
        <v-textarea
          hide-details="auto"
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[checkNotesLengthRule]" />
        <banner
          class="mb-4"
          v-if="showDuplicateWarning"
          :type="BannerTypes.Warning"
          header="Duplicate SIN Warning"
          summary="This SIN is currently associated with another student profile. Please investigate and correct any profiles with the incorrect SIN. If this is correct for the current student, please confirm and click 'Add SIN now'."
        >
        </banner>
        <v-checkbox
          v-if="showDuplicateWarning"
          label="I confirm this SIN is correct for the current student"
          v-model="formModel.confirmDuplicateSIN"
          hide-details="auto"
          :rules="[requiredCheckboxRule]"
          @update:model-value="
            (value: boolean | null) => (formModel.confirmDuplicateSIN = !!value)
          "
      /></template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              primary-label="Add SIN now"
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
import { useModalDialog, useRules } from "@/composables";
import { Role, VForm } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { CreateSINValidationAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/types/contracts/Banner";

export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { sinValidationRule, checkNotesLengthRule } = useRules();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      CreateSINValidationAPIInDTO | boolean
    >();
    const addNewSINForm = ref({} as VForm);
    const formModel = reactive({
      skipValidations: false,
      confirmDuplicateSIN: false,
    } as CreateSINValidationAPIInDTO);
    const showDuplicateWarning = ref(false);

    const requiredCheckboxRule = (value: boolean) =>
      value || "You must confirm to proceed";

    const submit = async () => {
      const validationResult = await addNewSINForm.value.validate();
      if (!validationResult.valid) {
        return;
      }

      // Copying the payload, as reset is making the formModel properties null.
      const payload = { ...formModel };
      resolvePromise(payload);
      addNewSINForm.value.reset();
      showDuplicateWarning.value = false;
    };

    const cancel = () => {
      addNewSINForm.value.reset();
      showDuplicateWarning.value = false;
      resolvePromise(false);
    };

    const setDuplicateWarning = (value: boolean) => {
      showDuplicateWarning.value = value;
      if (value) {
        formModel.confirmDuplicateSIN = false;
      }
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      setDuplicateWarning,
      addNewSINForm,
      formModel,
      showDuplicateWarning,
      BannerTypes,
      sinValidationRule,
      checkNotesLengthRule,
      requiredCheckboxRule,
    };
  },
});
</script>
