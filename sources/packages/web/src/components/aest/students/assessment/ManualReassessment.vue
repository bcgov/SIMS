<template>
  <v-card>
    <v-container>
      <TriggerReassessmentModal ref="reassessmentModal" />
      <body-header title="Trigger Reassessment Manually" class="m-1">
      </body-header>
      <content-group class="mt-4 pb-16">
        <p>
          Manual system trigger to re-perform assessment using existing
          application inputs. This should be used as a means of triggering the
          assessment or other downstream actions (COE requests, eCert requests)
          without requiring the student to edit and resubmit their application.
        </p>
        <check-permission-role :role="Role.AESTAdmin">
          <template #="{ notAllowed }">
            <v-btn
              class="ml-2 float-right"
              color="primary"
              prepend-icon="fa:fa fa-refresh"
              :disabled="notAllowed || openModalButtonDisabled"
              @click="openTriggerReassessmentModal()"
            >
              Trigger reassessment
            </v-btn>
          </template>
        </check-permission-role>
      </content-group>
    </v-container>
  </v-card>
</template>
<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { ManualReassessmentAPIInDTO } from "@/services/http/dto/Assessment.dto";
import TriggerReassessmentModal from "@/components/aest/students/modals/TriggerReassessmentModal.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { Role, StudentAssessmentStatus } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  emits: ["reassessmentTriggered"],
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
  setup(props, context) {
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
        applicationAssessmentStatusDetails.isApplicationArchived;
    });

    const openTriggerReassessmentModal = async () => {
      const responseData = await reassessmentModal.value.showModal();
      if (responseData) {
        try {
          await ApplicationService.shared.triggerManualReassessment(
            props.applicationId,
            responseData,
          );
          context.emit("reassessmentTriggered");
          snackBar.success("Reassessment triggered successfully.");
        } catch {
          snackBar.error("Unexpected error while triggering reassessment.");
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
