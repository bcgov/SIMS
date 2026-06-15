<template>
  <body-header-container
    :enable-card-view="true"
    title="Trigger Reassessment Manually"
    sub-title="Manual system trigger to re-perform assessment using existing application inputs. This should be used as a means of triggering the assessment or other downstream actions (COE requests, eCert requests) without requiring the student to edit and resubmit their application."
  >
    <content-group>
      <check-permission-role :role="Role.AESTManualTriggerReassessment">
        <template #="{ notAllowed }">
          <footer-buttons
            justify="end"
            :show-secondary-button="false"
            primary-label="Trigger reassessment"
            :disable-primary-button="notAllowed || openModalButtonDisabled"
            @click="openTriggerReassessmentModal"
            primary-prepend-icon="fa:fa fa-refresh"
          >
          </footer-buttons>
        </template>
      </check-permission-role>
    </content-group>
    <trigger-reassessment-modal ref="reassessmentModal" />
  </body-header-container>
</template>
<script lang="ts">
import { ref, defineComponent, watchEffect } from "vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { ManualReassessmentAPIInDTO } from "@/services/http/dto";
import TriggerReassessmentModal from "@/components/aest/students/modals/TriggerReassessmentModal.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationStatus, Role, StudentAssessmentStatus } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";

export default defineComponent({
  emits: {
    reassessmentTriggered: null,
  },
  components: {
    TriggerReassessmentModal,
    CheckPermissionRole,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const reassessmentModal = ref(
      {} as ModalDialog<ManualReassessmentAPIInDTO | false>,
    );
    const openModalButtonDisabled = ref(true);

    // Adding watch effect instead of onMounted because
    // applicationId may not be not available on load.
    watchEffect(async () => {
      if (props.applicationId) {
        const applicationAssessmentStatusDetails =
          await ApplicationService.shared.getApplicationAssessmentStatusDetails(
            props.applicationId,
          );
        openModalButtonDisabled.value =
          applicationAssessmentStatusDetails.originalAssessmentStatus !==
            StudentAssessmentStatus.Completed ||
          applicationAssessmentStatusDetails.assessmentDate === null ||
          applicationAssessmentStatusDetails.isApplicationArchived ||
          [
            ApplicationStatus.Cancelled,
            ApplicationStatus.Edited,
            ApplicationStatus.Draft,
          ].includes(applicationAssessmentStatusDetails.applicationStatus);
      }
    });

    const openTriggerReassessmentModal = async () => {
      const responseData = await reassessmentModal.value.showModal();
      if (responseData) {
        try {
          await StudentAssessmentsService.shared.triggerManualReassessment(
            props.applicationId,
            responseData,
          );
          emit("reassessmentTriggered");
          snackBar.success("Reassessment triggered successfully.");
        } catch {
          snackBar.error(
            "Unexpected error while triggering manual reassessment.",
          );
          reassessmentModal.value.loading = false;
        }
      }
    };
    return {
      reassessmentModal,
      openTriggerReassessmentModal,
      openModalButtonDisabled,
      Role,
    };
  },
});
</script>
