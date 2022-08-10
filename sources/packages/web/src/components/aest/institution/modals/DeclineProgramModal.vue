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
      <check-a-e-s-t-permission-role
        :role="Role.InstitutionApproveDeclineProgram"
      >
        <template v-slot="{ isReadonly }">
          <footer-buttons
            primaryLabel="Decline now"
            @primaryClick="declineProgram"
            @secondaryClick="dialogClosed"
            :disablePrimaryButton="isReadonly"
          />
        </template>
      </check-a-e-s-t-permission-role>
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { DeclineProgramAPIInDTO } from "@/services/http/dto";
import CheckAESTPermissionRole from "@/components/generic/CheckAESTPermissionRole.vue";
import { Role } from "@/types";

export default {
  components: {
    ModalDialogBase,
    CheckAESTPermissionRole,
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
