<template>
  <v-form ref="approveApplicationOfferingChangeRequest">
    <modal-dialog-base
      :showDialog="showDialog"
      title="StudentAid BC Declaration"
    >
      <template #content>
        <error-summary
          :errors="approveApplicationOfferingChangeRequest.errors"
        />
        <p>
          Please review and accept the StudentAid BC declaration to allow the
          institution to make proposed changes to your application (on your
          behalf).
        </p>
        <content-group-info class="div-scroll"
          ><h4 class="label-bold color-blue mb-5">StudentAid BC Declaration</h4>
          <title-value propertyTitle="StudentAid BC consent"
            ><template #value
              ><span
                >I am applying for funding to assist with my education under one
                or all of the following programs: Canada Student Loan for
                Part-time Studies, Canada Student Grant for students with
                Permanent Disabilities, the BC Supplemental Bursary for Students
                with a Permanent Disability, Canada Student Grant for Part-time
                Students, and if eligible, Canada Student Grant for Part-time
                Students with Dependants. Read More</span
              ></template
            ></title-value
          ></content-group-info
        ><v-checkbox
          v-model="formModel.studentConsent"
          label="I agree to the terms and conditions of the StudentAid BC Declaration
          form"
          hide-details="auto"
          :rules="[(v) => !!v || 'Student consent is required.']"
        ></v-checkbox>
      </template>
      <template #footer>
        <footer-buttons
          primaryLabel="Allow change"
          @secondaryClick="cancel"
          @primaryClick="allowChange"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ref, defineComponent, reactive } from "vue";
import { useModalDialog } from "@/composables";
import { StudentApplicationOfferingChangeRequestAPIInDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus, VForm } from "@/types";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    ErrorSummary,
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      StudentApplicationOfferingChangeRequestAPIInDTO | boolean
    >();
    const approveApplicationOfferingChangeRequestModal = ref(
      {} as StudentApplicationOfferingChangeRequestAPIInDTO,
    );
    const approveApplicationOfferingChangeRequest = ref({} as VForm);
    const formModel = reactive(
      {} as StudentApplicationOfferingChangeRequestAPIInDTO,
    );
    const cancel = () => {
      approveApplicationOfferingChangeRequest.value.reset();
      formModel.studentConsent = false;
      approveApplicationOfferingChangeRequest.value.resetValidation();
      resolvePromise(false);
    };
    const allowChange = async () => {
      const validationResult =
        await approveApplicationOfferingChangeRequest.value.validate();
      if (!validationResult.valid) {
        return;
      }
      approveApplicationOfferingChangeRequestModal.value.applicationOfferingChangeRequestStatus =
        ApplicationOfferingChangeRequestStatus.InProgressWithSABC;
      const payload = { ...formModel };
      resolvePromise(payload);
      approveApplicationOfferingChangeRequest.value.reset();
    };
    return {
      showDialog,
      showModal,
      cancel,
      allowChange,
      formModel,
      approveApplicationOfferingChangeRequest,
      approveApplicationOfferingChangeRequestModal,
    };
  },
});
</script>
