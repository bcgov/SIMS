<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Submission"
        :routeLocation="goToAssessmentSummary"
      >
        <template #buttons v-if="showScholasticStandingReversalAction">
          <check-permission-role :role="Role.StudentReverseScholasticStanding">
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                @click="showReverseScholasticStandingModal"
                :disabled="notAllowed"
                >Reverse</v-btn
              >
            </template>
          </check-permission-role>
        </template></header-navigator
      >
    </template>
    <scholastic-standing-form
      :scholasticStandingId="scholasticStandingId"
      :readOnly="true"
      :showFooter="true"
      :showCompleteInfo="true"
      :processing="false"
      @data-loaded="dataLoaded"
    />
    <reverse-scholastic-standing-modal ref="reverseScholasticStandingModal" />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, ref } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import ReverseScholasticStandingModal from "@/components/aest/students/modals/ReverseScholasticStandingModal.vue";
import {
  AssessmentTriggerType,
  Role,
  StudentScholasticStandingChangeType,
} from "@/types";
import { ModalDialog, useSnackBar } from "@/composables";
import {
  ReverseScholasticStandingAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";

/**
 * List of current assessment trigger types that allow scholastic standing reversal.
 */
const SCHOLASTIC_STANDING_REVERSAL_ALLOWED_TRIGGER_TYPES = [
  AssessmentTriggerType.ScholasticStandingChange,
  AssessmentTriggerType.RelatedApplicationChanged,
];

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
    CheckPermissionRole,
    ReverseScholasticStandingModal,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    scholasticStandingId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const scholasticStandingDetails = ref(
      {} as ScholasticStandingSubmittedDetailsAPIOutDTO,
    );
    const reverseScholasticStandingModal = ref(
      {} as ModalDialog<ReverseScholasticStandingAPIInDTO | false>,
    );
    // Show the reversal action button if the scholastic standing is not already reversed
    // and if the scholastic standing change type requires re-assessment (any change type except unsuccessful completion)
    // then check the current assessment trigger type
    // to determine if the reversal action is applicable.
    const showScholasticStandingReversalAction = computed(
      () =>
        !scholasticStandingDetails.value.reversalDate &&
        (SCHOLASTIC_STANDING_REVERSAL_ALLOWED_TRIGGER_TYPES.includes(
          scholasticStandingDetails.value.currentAssessmentTriggerType,
        ) ||
          scholasticStandingDetails.value.scholasticStandingChangeType ===
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram),
    );
    const goToAssessmentSummary = computed(
      () =>
        ({
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        } as RouteLocationRaw),
    );
    const showReverseScholasticStandingModal = async () => {
      const payload = await reverseScholasticStandingModal.value.showModal();
      if (payload) {
        try {
          await ScholasticStandingService.shared.reverseScholasticStanding(
            props.scholasticStandingId,
            payload,
          );
          snackBar.success("Scholastic standing reversed successfully.");
          await router.push(goToAssessmentSummary.value);
        } catch {
          snackBar.error(
            "Unexpected error while reversing the scholastic standing.",
          );
          reverseScholasticStandingModal.value.loading = false;
        }
      }
    };

    const dataLoaded = (data: ScholasticStandingSubmittedDetailsAPIOutDTO) => {
      scholasticStandingDetails.value = data;
    };

    return {
      goToAssessmentSummary,
      Role,
      reverseScholasticStandingModal,
      showReverseScholasticStandingModal,
      dataLoaded,
      showScholasticStandingReversalAction,
    };
  },
};
</script>
