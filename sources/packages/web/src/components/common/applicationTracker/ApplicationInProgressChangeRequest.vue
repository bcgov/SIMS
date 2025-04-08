<template>
  <application-status-tracker-banner
    v-if="!!changeRequest"
    label="You have a submitted change request that is still pending. Please see below for the next steps."
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
  >
    <template #content
      ><p><strong>Currently your change request is waiting for:</strong></p>
      <ul>
        <li
          v-if="
            changeRequest?.applicationEditStatus ===
            ApplicationEditStatus.ChangePendingApproval
          "
        >
          Waiting on Student Aid BC to approve the change.
        </li>
        <li
          v-if="
            changeRequest.parent1Info === SuccessWaitingStatus.Waiting ||
            changeRequest.parent2Info === SuccessWaitingStatus.Waiting
          "
        >
          Pending parent declaration information.
        </li>
        <li v-if="changeRequest.partnerInfo === SuccessWaitingStatus.Waiting">
          Pending partner declaration information.
        </li>
        <li
          v-if="
            changeRequest.studentIncomeVerificationStatus ===
            SuccessWaitingStatus.Waiting
          "
        >
          Pending student income verification information.
        </li>
        <li
          v-if="
            changeRequest.parent1IncomeVerificationStatus ===
              SuccessWaitingStatus.Waiting ||
            changeRequest.parent2IncomeVerificationStatus ===
              SuccessWaitingStatus.Waiting
          "
        >
          Pending parent income verification information.
        </li>
        <li
          v-if="
            changeRequest.partnerIncomeVerificationStatus ===
            SuccessWaitingStatus.Waiting
          "
        >
          Pending partner income verification information.
        </li>
      </ul>
    </template>
    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        class="mr-2"
        @click="cancelRequest"
        :loading="cancelChangeRequestLoading"
        :disabled="!areApplicationActionsAllowed || cancelChangeRequestLoading"
        >Cancel change request</v-btn
      >
      <v-btn
        color="primary"
        class="ml-2"
        @click="viewChangeRequest"
        :disabled="!areApplicationActionsAllowed || cancelChangeRequestLoading"
      >
        View change request</v-btn
      >
    </template>
  </application-status-tracker-banner>
  <confirm-modal
    title="Cancel change request"
    ref="cancelChangeRequestModal"
    okLabel="Confirm cancellation"
    text="Are you sure you want to cancel your change request? You will not be able to reverse this cancellation once it has been confirmed."
  />
</template>

<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/common/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { ChangeRequestInProgressAPIOutDTO } from "@/services/http/dto";
import { defineComponent, PropType, ref } from "vue";
import { ApplicationEditStatus, SuccessWaitingStatus } from "@/types";
import { ModalDialog, useSnackBar } from "@/composables";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";
import { ApplicationService } from "@/services/ApplicationService";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    changeRequest: {
      type: Object as PropType<ChangeRequestInProgressAPIOutDTO>,
      required: false,
    },
    areApplicationActionsAllowed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const cancelChangeRequestModal = ref({} as ModalDialog<boolean>);
    const snackBar = useSnackBar();
    const cancelChangeRequestLoading = ref(false);

    const viewChangeRequest = async () => {
      if (!props.changeRequest) {
        return;
      }
      const applicationId = props.changeRequest.applicationId;
      const applicationProgramYear =
        await ApplicationService.shared.getApplicationWithPY(applicationId);
      await router.push({
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_CHANGE_REQUEST_APP_FORM,
        params: {
          selectedForm: applicationProgramYear.formName,
          programYearId: applicationProgramYear.programYearId,
          id: applicationId,
        },
      });
    };

    const cancelChangeRequest = async (applicationId: number) => {
      if (!props.changeRequest) {
        return;
      }
      const confirm = await cancelChangeRequestModal.value.showModal();
      if (!confirm) {
        return;
      }
      try {
        cancelChangeRequestLoading.value = true;
        await ApplicationService.shared.applicationCancelChangeRequest(
          applicationId,
        );
      } catch {
        snackBar.error(
          "There was an error cancelling your change request. Please try again.",
        );
      } finally {
        cancelChangeRequestLoading.value = false;
      }
    };

    return {
      SuccessWaitingStatus,
      ApplicationEditStatus,
      cancelChangeRequest,
      cancelChangeRequestModal,
      viewChangeRequest,
      cancelChangeRequestLoading,
    };
  },
});
</script>
