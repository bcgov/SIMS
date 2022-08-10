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
      <check-a-e-s-t-permission-role
        :role="Role.InstitutionApproveDeclineProgram"
      >
        <template v-slot="{ isReadonly }">
          <footer-buttons
            primaryLabel="Approve now"
            @primaryClick="approveProgram"
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
import { ApproveProgramAPIInDTO } from "@/services/http/dto";
import CheckAESTPermissionRole from "@/components/generic/CheckAESTPermissionRole.vue";
import { Role } from "@/types";

export default {
  components: {
    ModalDialogBase,
    CheckAESTPermissionRole,
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
