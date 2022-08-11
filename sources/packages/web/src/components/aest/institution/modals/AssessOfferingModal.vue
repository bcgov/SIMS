<template>
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    :title="title"
  >
    <template v-slot:content>
      <div class="mt-2">
        <formio
          formName="approvedeclineoffering"
          :data="{ offeringStatus }"
          @loaded="formLoaded"
          @submitted="submitOfferingAssessment"
        ></formio>
      </div>
    </template>
    <template v-slot:footer>
      <check-permission-role :role="Role.InstitutionApproveDeclineOffering">
        <template #="{ notAllowed }">
          <footer-buttons
            primaryLabel="Submit Action"
            @primaryClick="submitForm"
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
import { computed } from "vue";
import { OfferingStatus, Role } from "@/types";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: { ModalDialogBase, CheckPermissionRole },
  props: {
    offeringStatus: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      OfferingAssessmentAPIInDTO | boolean
    >();
    let formData: any = undefined;

    const title = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Approve Offering"
        : "Decline Offering",
    );

    const dialogClosed = () => {
      resolvePromise(false);
    };

    const formLoaded = (form: any) => {
      formData = form;
    };

    const submitOfferingAssessment = (data: OfferingAssessmentAPIInDTO) => {
      resolvePromise(data);
    };

    // method to be called from submit button in vue modal
    const submitForm = () => {
      return formData.submit();
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      formLoaded,
      submitOfferingAssessment,
      submitForm,
      title,
      Role,
    };
  },
};
</script>
