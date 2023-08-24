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
          ><h4 class="label-bold color-blue">StudentAid BC Declaration</h4>
          <v-row
            ><v-col
              ><span class="label-bold-large-vertical-height"
                >I. I. I/we understand that:</span
              >
            </v-col></v-row
          ><v-list class="list-color mb-5">
            <v-list-item>
              1. The student will have access to information provided in this
              appendix;
            </v-list-item>
            <v-list-item>
              2. The student's school will have access to information provided
              in this appendix;
            </v-list-item>
            <v-list-item>
              3. The information in this appendix is subject to audit,
              investigation and verification as defined in the current program
              year's StudentAid BC Policy Manual
            </v-list-item>
          </v-list>
          <v-row
            ><v-col
              ><span class="label-bold">Collection and use of information</span>
            </v-col></v-row
          >
          <v-row
            ><v-col
              >The information included in this form and authorized above is
              collected and managed in accordance with sections 26(c) and 26(e)
              of the Freedom of Information and Protection of Privacy Act,
              R.S.B.C. 1996, c. 165, and under the authority of the Canada
              Student Financial Assistance Act, R.S.C. 1994, Chapter C-28 and
              StudentAid BC. The information provided will be used to determine
              eligibility for a benefit through</v-col
            ></v-row
          > </content-group-info
        ><v-checkbox
          v-model="approveApplicationOfferingChangeRequestModal.studentConsent"
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
import { ref, defineComponent, watch } from "vue";
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
    const cancel = () => {
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
      resolvePromise(approveApplicationOfferingChangeRequestModal.value);
    };
    watch(showDialog, async (newshowDialogValue) => {
      if (newshowDialogValue) {
        approveApplicationOfferingChangeRequestModal.value.studentConsent =
          false;
      }
    });
    return {
      showDialog,
      showModal,
      cancel,
      allowChange,
      approveApplicationOfferingChangeRequest,
      approveApplicationOfferingChangeRequestModal,
    };
  },
});
</script>
