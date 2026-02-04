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
          class="mt-4"
          v-if="showDuplicateWarning"
          :type="BannerTypes.Warning"
          header="Duplicate SIN Warning"
          summary='This SIN is currently associated with another student profile. Please investigate and correct any profiles with the incorrect SIN. If this is correct for the current student, please confirm and click "Add SIN now".'
        >
        </banner>
        <v-checkbox
          v-if="showDuplicateWarning"
          label="I confirm this SIN is correct for the current student."
          v-model="formModel.confirmDuplicateSIN"
          hide-details="auto"
          :rules="[requiredCheckboxRule]"
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
import { useModalDialog, useRules, useSnackBar } from "@/composables";
import { ApiProcessError, Role, VForm } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { CreateSINValidationAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/types/contracts/Banner";
import { StudentService } from "@/services/StudentService";
import { SIN_DUPLICATE_NOT_CONFIRMED } from "@/constants";

export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const { sinValidationRule, checkNotesLengthRule } = useRules();
    const { showDialog, showModal, resolvePromise } = useModalDialog<boolean>();
    const addNewSINForm = ref({} as VForm);
    const formModel = reactive({
      skipValidations: false,
      confirmDuplicateSIN: false,
    } as CreateSINValidationAPIInDTO);
    const showDuplicateWarning = ref(false);

    const requiredCheckboxRule = (value: boolean) =>
      value || "You must confirm to proceed.";

    const submit = async () => {
      const validationResult = await addNewSINForm.value.validate();
      if (!validationResult.valid) {
        return;
      }

      if (await createSINValidation()) {
        resolvePromise(true);
        addNewSINForm.value.reset();
        showDuplicateWarning.value = false;
      }
    };

    const createSINValidation = async () => {
      try {
        await StudentService.shared.createStudentSINValidation(
          props.studentId,
          formModel,
        );
        snackBar.success(
          "New SIN record created and associated to the student.",
        );
      } catch (error: unknown) {
        // Check if this is a duplicate SIN error.
        if (
          error instanceof ApiProcessError &&
          error.errorType === SIN_DUPLICATE_NOT_CONFIRMED
        ) {
          // Show the duplicate warning in the modal and retry.
          showDuplicateWarning.value = true;
          return false;
        }
        snackBar.error("Unexpected error while creating a new SIN record.");
        return false;
      }

      return true;
    };

    const cancel = () => {
      addNewSINForm.value.reset();
      showDuplicateWarning.value = false;
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
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
