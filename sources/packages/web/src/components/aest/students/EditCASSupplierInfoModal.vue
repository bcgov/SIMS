<template>
  <v-form ref="addCASSupplierForm">
    <modal-dialog-base
      title="Update supplier/Site information"
      :showDialog="showDialog"
    >
      <template #content>
        <error-summary :errors="addCASSupplierForm.errors" />
        <div class="pb-5">
          <span class="label-value"
            >Enter new supplier number and/or site number for this student to
            maintain consistency with CAS validations.</span
          >
        </div>
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
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              primaryLabel="Update info"
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
import { PropType, ref, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog, useRules } from "@/composables";
import { Role, VForm } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { AddCASSupplierAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
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

    const supplierNumberValidationRule = (value) => {
      if (!value) {
        return "Supplier number is mandatory.";
      } else if (value.length > 30) {
        return "Supplier number max length is 30.";
      } else if (!value.match(/^\d+$/)) {
        return "Only numbers allowed.";
      }
      return true;
    };

    const supplierSiteCodeValidationRule = (value) => {
      if (!value) {
        return "Supplier site code is mandatory.";
      } else if (value.length > 3) {
        return "Supplier site code max length is 3.";
      } else if (!value.match(/^\d+$/)) {
        return "Only numbers allowed.";
      }
      return true;
    };

    const formatSupplierNumber = (event) => {
      if (supplierNumberValidationRule(formModel.supplierNumber) === true) {
        const numberOfChars = 7;
        const currentValue = event.target.value;
        formModel.supplierNumber = currentValue.padStart(numberOfChars, "0");
      }
    };

    const formatSupplierSiteCode = (event) => {
      if (supplierSiteCodeValidationRule(formModel.supplierSiteCode) === true) {
        const numberOfChars = 3;
        const currentValue = event.target.value;
        formModel.supplierSiteCode = currentValue.padStart(numberOfChars, "0");
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
    };
  },
});
</script>
