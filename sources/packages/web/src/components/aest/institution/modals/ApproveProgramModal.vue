<template>
  <modal-dialog-base
    title="Approve program"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <formio
        formName="approveEducationProgram"
        @submitted="submitForm"
        @loaded="formLoaded"
      ></formio>
    </template>
    <template v-slot:footer>
      <check-permission-role :role="Role.InstitutionApproveDeclineProgram">
        <template #="{ notAllowed }">
          <footer-buttons
            primaryLabel="Approve now"
            @primaryClick="approveProgram"
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
import { ApproveProgramAPIInDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role } from "@/types";

export default {
  components: {
    ModalDialogBase,
    CheckPermissionRole,
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      ApproveProgramAPIInDTO | undefined
    >();
    let approveProgramForm: any = undefined;

    const approveProgram = () => {
      return approveProgramForm.submit();
    };
    const submitForm = (formData: ApproveProgramAPIInDTO) => {
      resolvePromise(formData);
    };

    const formLoaded = (form: any) => {
      approveProgramForm = form;
    };

    const dialogClosed = () => {
      resolvePromise(undefined);
    };

    return {
      showDialog,
      approveProgram,
      showModal,
      dialogClosed,
      formLoaded,
      submitForm,
      Role,
    };
  },
};
</script>
