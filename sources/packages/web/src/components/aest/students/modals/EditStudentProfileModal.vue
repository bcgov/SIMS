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
              class="mb-6"
            /> </template
        ></title-value>
        <title-value
          ><template #value
            ><v-text-field
              hide-details="auto"
              label="Last Name"
              v-model="formModel.lastName"
              variant="outlined"
              :rules="[checkLastNameLengthRule]"
              class="mb-6"
            /> </template
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
              class="mb-6"
            /> </template
        ></title-value>
        <title-value
          ><template #value
            ><v-text-field
              hide-details="auto"
              label="Email"
              v-model="formModel.email"
              variant="outlined"
              :rules="[checkEmailLengthRule, checkEmailValidationRule]"
              class="mb-6"
            /> </template
        ></title-value>
        <title-value
          ><template #value>
            <v-textarea
              label="Notes"
              v-model="formModel.noteDescription"
              variant="outlined"
              :rules="[checkNotesLengthRule]"
            /> </template
        ></title-value>
        <title-value
          ><template #value
            ><v-input
              :rules="[hasDataChangedValidationRule]"
              hide-details="auto"
            /> </template
        ></title-value>
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primaryLabel="Update Profile"
          @primaryClick="submit"
          @secondaryClick="cancel"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import TitleValue from "@/components/generic/TitleValue.vue";
import { useFormatters, useModalDialog, useRules } from "@/composables";
import { UpdateStudentDetailsAPIInDTO } from "@/services/http/dto";
import { Role, VForm } from "@/types";
import dayjs from "dayjs";

export default defineComponent({
  components: {
    ModalDialogBase,
    TitleValue,
  },
  setup() {
    const {
      checkGivenNameLengthRule,
      checkLastNameLengthRule,
      checkEmailLengthRule,
      checkEmailValidationRule,
      checkNotesLengthRule,
    } = useRules();
    const { getISODateOnlyString } = useFormatters();
    const getTodaysDate = (): string => {
      return getISODateOnlyString(new Date());
    };
    const {
      showDialog,
      showModal: showModalInternal,
      resolvePromise,
      loading,
    } = useModalDialog<UpdateStudentDetailsAPIInDTO | boolean>();
    const editStudentProfileForm = ref({} as VForm);
    const formModel = ref({} as UpdateStudentDetailsAPIInDTO);
    const submit = async () => {
      const validationResult = await editStudentProfileForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      await resolvePromise(formModel.value);
    };
    let initialStudentProfile = {} as UpdateStudentDetailsAPIInDTO;

    const hasDataChangedValidationRule = () => {
      if (
        initialStudentProfile.email.toLowerCase() ===
          formModel.value.email.toLowerCase() &&
        initialStudentProfile.givenNames?.toLowerCase() ===
          formModel.value.givenNames?.toLowerCase() &&
        initialStudentProfile.lastName.toLowerCase() ===
          formModel.value.lastName.toLowerCase() &&
        dayjs(initialStudentProfile.birthdate).isSame(formModel.value.birthdate)
      ) {
        return "No changes detected to be updated.";
      }
      return true;
    };

    const showModal = async (
      studentProfile: UpdateStudentDetailsAPIInDTO,
      canResolvePromise?: (
        value: UpdateStudentDetailsAPIInDTO | boolean,
      ) => Promise<boolean>,
    ) => {
      initialStudentProfile = studentProfile;
      formModel.value = {
        givenNames: studentProfile.givenNames,
        lastName: studentProfile.lastName,
        birthdate: studentProfile.birthdate,
        email: studentProfile.email,
        noteDescription: "",
      };
      return showModalInternal(studentProfile, canResolvePromise);
    };

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
      checkGivenNameLengthRule,
      checkLastNameLengthRule,
      checkEmailLengthRule,
      checkEmailValidationRule,
      checkNotesLengthRule,
      Role,
      hasDataChangedValidationRule,
    };
  },
});
</script>
