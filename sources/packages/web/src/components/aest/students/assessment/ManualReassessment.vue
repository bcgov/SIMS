<template>
  <body-header-container :enableCardView="true">
    <trigger-reassessment-modal ref="reassessmentModal" />
    <template #header>
      <body-header
        title="Trigger Reassessment Manually"
        subTitle="Manual system trigger to re-perform assessment using existing application inputs. This should be used as a means of triggering the assessment or other downstream actions (COE requests, eCert requests) without requiring the student to edit and resubmit their application."
      />
    </template>
    <content-group class="mt-4 pb-16">
      <check-permission-role :role="Role.AESTManualTriggerReassessment">
        <template #="{ notAllowed }">
          <v-btn
            class="ml-2 float-right"
            color="primary"
            prepend-icon="fa:fa fa-refresh"
            :disabled="notAllowed || openModalButtonDisabled"
            @click="openTriggerReassessmentModal"
          >
            Trigger reassessment
          </v-btn>
        </template>
      </check-permission-role>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
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

    onMounted(async () => {
      const applicationAssessmentStatusDetails =
        await ApplicationService.shared.getApplicationAssessmentStatusDetails(
          props.applicationId,
        );
      openModalButtonDisabled.value =
        applicationAssessmentStatusDetails.originalAssessmentStatus !==
          StudentAssessmentStatus.Completed ||
        applicationAssessmentStatusDetails.isApplicationArchived ||
        [
          ApplicationStatus.Cancelled,
          ApplicationStatus.Edited,
          ApplicationStatus.Draft,
        ].includes(applicationAssessmentStatusDetails.applicationStatus);
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
