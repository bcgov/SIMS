<template>
  <v-form ref="editStudentProfileForm">
    <modal-dialog-base
      title="Edit Student Profile"
      sub-title="Enter the information to be updated below."
      :showDialog="showDialog"
    >
      <template #content>
        <title-value
          ><template #value
            ><v-text-field
              hide-details="auto"
              label="Given Names"
              v-model="formModel.givenNames"
              variant="outlined"
              :rules="[checkGivenNameLengthRule]"
              class="mb-6" />
            <v-spacer /></template
        ></title-value>
        <title-value
          ><template #value
            ><v-text-field
              hide-details="auto"
              label="Lastname"
              v-model="formModel.lastName"
              variant="outlined"
              :rules="[checkLastNameLengthRule]"
              class="mb-6" />
            <v-spacer /></template
        ></title-value>
        <title-value
          ><template #value
            ><v-text-field
              density="compact"
              label="Date of Birth"
              variant="outlined"
              v-model="formModel.birthdate"
              type="date"
              :max="getTodaysDate()"
              hide-details="auto"
              class="mb-6" />
            <v-spacer /></template
        ></title-value>
        <title-value
          ><template #value
            ><v-text-field
              hide-details="auto"
              label="Email"
              v-model="formModel.email"
              variant="outlined"
              :rules="[checkEmailLengthRule, checkEmailValidationRule]"
              class="mb-6" />
            <v-spacer /></template
        ></title-value>
      </template>
      <template #footer>
        <check-permission-role :role="Role.StudentEditProfile">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="loading"
              primaryLabel="Update Profile"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, PropType } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import TitleValue from "@/components/generic/TitleValue.vue";
import { useFormatters, useModalDialog, useRules } from "@/composables";
import {
  UpdateStudentDetailsAPIInDTO,
  UpdateStudentDetails,
} from "@/services/http/dto";
import { Role, VForm } from "@/types";

export default defineComponent({
  components: {
    ModalDialogBase,
    TitleValue,
  },
  props: {
    updatedStudentDetails: {
      type: Object as PropType<UpdateStudentDetails>,
      required: true,
    },
  },
  setup(props) {
    const {
      checkGivenNameLengthRule,
      checkLastNameLengthRule,
      checkEmailLengthRule,
      checkEmailValidationRule,
    } = useRules();
    const { getISODateOnlyString } = useFormatters();
    const getTodaysDate = (): string => {
      return getISODateOnlyString(new Date());
    };
    const { showDialog, showModal, resolvePromise, loading, showParameter } =
      useModalDialog<UpdateStudentDetailsAPIInDTO | boolean>();
    const editStudentProfileForm = ref({} as VForm);
    const formModel = ref({} as UpdateStudentDetailsAPIInDTO);
    const submit = async () => {
      const validationResult = await editStudentProfileForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      // Copying the payload, as reset makes the formModel properties null.
      await resolvePromise(formModel.value);
    };
    watchEffect(() => {
      formModel.value = {
        givenNames: props.updatedStudentDetails.givenNames,
        lastName: props.updatedStudentDetails.lastName,
        birthdate: props.updatedStudentDetails.birthdate,
        email: props.updatedStudentDetails.email,
      };
    });

    const cancel = () => {
      editStudentProfileForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      getTodaysDate,
      showDialog,
      showModal,
      editStudentProfileForm,
      formModel,
      submit,
      cancel,
      loading,
      showParameter,
      checkGivenNameLengthRule,
      checkLastNameLengthRule,
      checkEmailLengthRule,
      checkEmailValidationRule,
      Role,
    };
  },
});
</script>
