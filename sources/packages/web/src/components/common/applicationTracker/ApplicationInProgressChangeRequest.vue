<template>
  <application-status-tracker-banner
    v-if="changeRequest"
    :label="trackerLabel"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
  >
    <template #content v-if="waitingList.length">
      <p><strong>Currently your change request is waiting for:</strong></p>
      <ul>
        <li v-if="waitingList.includes(WaitingTypes.MinistryApproval)">
          Waiting on StudentAid BC to approve the change.
        </li>
        <li v-if="waitingList.includes(WaitingTypes.StudentIncomeVerification)">
          Pending student income verification information.
        </li>
        <li v-if="waitingList.includes(WaitingTypes.ParentsDeclaration)">
          Pending parent declaration information.
        </li>
        <li v-if="waitingList.includes(WaitingTypes.PartnerDeclaration)">
          Pending partner declaration information.
        </li>
        <li v-if="waitingList.includes(WaitingTypes.ParentsIncomeVerification)">
          Pending parent income verification information.
        </li>
        <li v-if="waitingList.includes(WaitingTypes.PartnerIncomeVerification)">
          Pending partner income verification information.
        </li>
      </ul>
    </template>
    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        class="mr-2"
        @click="cancelChangeRequest"
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
import { computed, defineComponent, PropType, ref } from "vue";
import { ApplicationEditStatus, SuccessWaitingStatus } from "@/types";
import { ModalDialog, useSnackBar } from "@/composables";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";
import { ApplicationService } from "@/services/ApplicationService";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";

/**
 * Possible waiting processes to be displayed to the student.
 */
enum WaitingTypes {
  MinistryApproval = "MinistryApproval",
  ParentsDeclaration = "ParentsDeclaration",
  PartnerDeclaration = "PartnerDeclaration",
  StudentIncomeVerification = "StudentIncomeVerification",
  ParentsIncomeVerification = "ParentsIncomeVerification",
  PartnerIncomeVerification = "PartnerIncomeVerification",
}

export default defineComponent({
  emits: {
    changeRequestCancelled: () => true,
  },
  components: {
    ApplicationStatusTrackerBanner,
    ConfirmModal,
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
  setup(props, { emit }) {
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

    const cancelChangeRequest = async () => {
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
          props.changeRequest.applicationId,
        );
        emit("changeRequestCancelled");
      } catch {
        snackBar.error(
          "There was an error cancelling your change request. Please try again.",
        );
      } finally {
        cancelChangeRequestLoading.value = false;
      }
    };

    /**
     * Creates the list of processes currently waiting that are
     * meaningful to be displayed to the student.
     */
    const waitingList = computed(() => {
      if (!props.changeRequest) {
        return [];
      }
      const waitingList: WaitingTypes[] = [];
      const change = props.changeRequest;
      if (
        change.applicationEditStatus ===
        ApplicationEditStatus.ChangePendingApproval
      ) {
        waitingList.push(WaitingTypes.MinistryApproval);
      }
      if (
        [change.parent1Info, change.parent2Info].includes(
          SuccessWaitingStatus.Waiting,
        )
      ) {
        waitingList.push(WaitingTypes.ParentsDeclaration);
      }
      if (change.partnerInfo === SuccessWaitingStatus.Waiting) {
        waitingList.push(WaitingTypes.PartnerDeclaration);
      }
      if (
        change.studentIncomeVerificationStatus === SuccessWaitingStatus.Waiting
      ) {
        waitingList.push(WaitingTypes.StudentIncomeVerification);
      }
      if (
        [
          change.parent1IncomeVerificationStatus,
          change.parent2IncomeVerificationStatus,
        ].includes(SuccessWaitingStatus.Waiting)
      ) {
        waitingList.push(WaitingTypes.ParentsIncomeVerification);
      }
      if (
        change.partnerIncomeVerificationStatus === SuccessWaitingStatus.Waiting
      ) {
        waitingList.push(WaitingTypes.PartnerIncomeVerification);
      }
      return waitingList;
    });

    /**
     * Adjust the label based on the waiting list.
     */
    const trackerLabel = computed(() => {
      return waitingList.value.length
        ? "You have a submitted change request that is still pending. Please see below for the next steps."
        : "You have a submitted change request that is still pending.";
    });

    return {
      cancelChangeRequest,
      cancelChangeRequestModal,
      viewChangeRequest,
      cancelChangeRequestLoading,
      waitingList,
      WaitingTypes,
      trackerLabel,
    };
  },
});
</script>
