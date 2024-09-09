<template>
  <v-form ref="addCASSupplierForm">
    <modal-dialog-base
      title="Update supplier/site information"
      sub-title="Enter new supplier number and site number for this student to maintain
          consistency with CAS validations."
      :showDialog="showDialog"
    >
      <template #content>
        <error-summary :errors="addCASSupplierForm.errors" />
        <v-text-field
          hide-details="auto"
          label="Supplier number"
          v-model="formModel.supplierNumber"
          variant="outlined"
          :rules="[supplierNumberValidationRule]"
          @blur="formatSupplierNumber($event)"
          required
          class="mb-4"
        />
        <v-spacer />
        <v-text-field
          hide-details="auto"
          label="Site code"
          v-model="formModel.supplierSiteCode"
          variant="outlined"
          :rules="[supplierSiteCodeValidationRule]"
          @blur="formatSupplierSiteCode($event)"
          required
        />
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primaryLabel="Update info"
          @secondaryClick="cancel"
          @primaryClick="submit"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog, useRules } from "@/composables";
import { Role, VForm, Event } from "@/types";
import { AddCASSupplierAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  components: { ModalDialogBase, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const SUPPLIER_NUMBER_INPUT_FIELD_NAME = "Supplier number";
    const SUPPLIER_NUMBER_INPUT_FIELD_MAX_LENGTH = 30;
    const SUPPLIER_NUMBER_PAD_NUMBER_OF_CHARS = 7;
    const SUPPLIER_SITE_CODE_INPUT_FIELD_NAME = "Site code";
    const SUPPLIER_SITE_CODE_INPUT_FIELD_MAX_LENGTH = 3;
    const SUPPLIER_SITE_CODE_PAD_NUMBER_OF_CHARS = 3;
    const PADDING_CHAR = "0";

    const { checkOnlyDigitsRule, checkLengthRule, checkNullOrEmptyRule } =
      useRules();
    const { showDialog, showModal, resolvePromise, loading } = useModalDialog<
      AddCASSupplierAPIInDTO | boolean
    >();
    const addCASSupplierForm = ref({} as VForm);
    const formModel = reactive({} as AddCASSupplierAPIInDTO);

    const submit = async () => {
      const validationResult = await addCASSupplierForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      // Copying the payload, as reset is making the formModel properties null.
      const payload = { ...formModel };
      resolvePromise(payload);
      addCASSupplierForm.value.reset();
    };

    const cancel = () => {
      addCASSupplierForm.value.reset();
      addCASSupplierForm.value.resetValidation();
      resolvePromise(false);
    };

    const supplierNumberValidationRule = (value: string) => {
      const checkNullOrEmptyRuleResult = checkNullOrEmptyRule(
        value,
        SUPPLIER_NUMBER_INPUT_FIELD_NAME,
      );
      if (checkNullOrEmptyRuleResult !== true) {
        return checkNullOrEmptyRuleResult;
      } else {
        const checkLengthRuleResult = checkLengthRule(
          value,
          SUPPLIER_NUMBER_INPUT_FIELD_MAX_LENGTH,
          SUPPLIER_NUMBER_INPUT_FIELD_NAME,
        );
        if (checkLengthRuleResult !== true) {
          return checkLengthRuleResult;
        } else {
          {
            return checkOnlyDigitsRule(value, SUPPLIER_NUMBER_INPUT_FIELD_NAME);
          }
        }
      }
    };

    const supplierSiteCodeValidationRule = (value: string) => {
      const checkNullOrEmptyRuleResult = checkNullOrEmptyRule(
        value,
        SUPPLIER_SITE_CODE_INPUT_FIELD_NAME,
      );
      if (checkNullOrEmptyRuleResult !== true) {
        return checkNullOrEmptyRuleResult;
      } else {
        const checkLengthRuleResult = checkLengthRule(
          value,
          SUPPLIER_SITE_CODE_INPUT_FIELD_MAX_LENGTH,
          SUPPLIER_SITE_CODE_INPUT_FIELD_NAME,
        );
        if (checkLengthRuleResult !== true) {
          return checkLengthRuleResult;
        } else {
          {
            return checkOnlyDigitsRule(
              value,
              SUPPLIER_SITE_CODE_INPUT_FIELD_NAME,
            );
          }
        }
      }
    };

    const formatSupplierNumber = (event: Event) => {
      if (supplierNumberValidationRule(formModel.supplierNumber) === true) {
        const currentValue = event.target.value;
        formModel.supplierNumber = currentValue.padStart(
          SUPPLIER_NUMBER_PAD_NUMBER_OF_CHARS,
          PADDING_CHAR,
        );
      }
    };

    const formatSupplierSiteCode = (event: Event) => {
      if (supplierSiteCodeValidationRule(formModel.supplierSiteCode) === true) {
        const currentValue = event.target.value;
        formModel.supplierSiteCode = currentValue.padStart(
          SUPPLIER_SITE_CODE_PAD_NUMBER_OF_CHARS,
          PADDING_CHAR,
        );
      }
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      addCASSupplierForm,
      formModel,
      supplierNumberValidationRule,
      supplierSiteCodeValidationRule,
      formatSupplierNumber,
      formatSupplierSiteCode,
      loading,
    };
  },
});
</script>
