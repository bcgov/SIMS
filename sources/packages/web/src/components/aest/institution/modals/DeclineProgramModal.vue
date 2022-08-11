<template>
  <modal-dialog-base
    title="Decline program"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <formio
        formName="declineEducationProgram"
        @submitted="submitForm"
        @loaded="formLoaded"
      ></formio>
    </template>
    <template v-slot:footer>
      <check-permission-role :role="Role.InstitutionApproveDeclineProgram">
        <template #="{ notAllowed }">
          <footer-buttons
            primaryLabel="Decline now"
            @primaryClick="declineProgram"
            @secondaryClick="dialogClosed"
            :disablePrimaryButton="notAllowed"
          />
        </template>
      </check-permission-role>
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { DeclineProgramAPIInDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role } from "@/types";

export default {
  components: {
    ModalDialogBase,
    CheckPermissionRole,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      DeclineProgramAPIInDTO | undefined
    >();
    let declineProgramForm: any = undefined;

    const declineProgram = () => {
      return declineProgramForm.submit();
    };
    const submitForm = (formData: DeclineProgramAPIInDTO) => {
      resolvePromise(formData);
    };

    const formLoaded = (form: any) => {
      declineProgramForm = form;
    };

    const dialogClosed = () => {
      resolvePromise(undefined);
    };

    return {
      showDialog,
      declineProgram,
      showModal,
      dialogClosed,
      formLoaded,
      submitForm,
      Role,
    };
  },
};
</script>
