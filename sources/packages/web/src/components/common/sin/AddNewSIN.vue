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
          :rules="[(v) => sinValidation(v)]" />
        <v-checkbox
          label="Skip the validations"
          v-model="formModel.skipValidations"
          hide-details />
        <banner
          class="mb-4"
          v-if="formModel.skipValidations"
          :type="BannerTypes.Error"
          header="Danger! Are you sure you want to skip the validations?"
          summary=" By selecting this, you are forcing the SIN to be valid for the
            student. Please proceed with caution."
        >
        </banner>
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
import { BannerTypes } from "@/types/contracts/Banner";

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
      resolvePromise(formModel);
      formModel.skipValidations = false;
      addNewSINForm.value.reset();
    };

    const cancel = () => {
      addNewSINForm.value.reset();
      formModel.skipValidations = false;
      addNewSINForm.value.resetValidation();
      resolvePromise(false);
    };

    const sinValidation = (sin) => {
      // Common SIN validation algorithm (Luhn algorithm).
      if (sin) {
        sin = sin.replace(/\s/g, "");
        if (sin.length === 9) {
          var checksum = 0;
          for (var i = 0; i < sin.length; i++) {
            const currentDigit = parseInt(sin.charAt(i));
            if ((i + 1) % 2 === 0) {
              const digitTimes2 = currentDigit * 2;
              checksum += digitTimes2 < 10 ? digitTimes2 : digitTimes2 - 9;
            } else {
              checksum += parseInt(sin.charAt(i));
            }
          }
          if (checksum % 10 === 0) {
            return true;
          }
        }
        return "Invalid Social Insurance Number";
      }
      return "SIN is required";
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      Role,
      addNewSINForm,
      formModel,
      BannerTypes,
      sinValidation,
    };
  },
};
</script>
