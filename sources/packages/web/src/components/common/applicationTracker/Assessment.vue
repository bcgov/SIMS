<template>
  <related-application-changed
    v-if="
      assessmentTriggerType === AssessmentTriggerType.RelatedApplicationChanged
    "
  />
  <application-status-tracker-banner
    label="Action required! Please accept your assessment"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    ><template #content
      >Your assessment is ready. You must view and accept your assessment by
      clicking "View assessment" below. Please note that you may not be able to
      accept your assessment if you have a restriction, your Master Student
      Financial Assistance Agreement (MSFAA) is not signed, or further action is
      required on your application.
    </template>
    <template #actions>
      <v-btn color="primary" @click="goToViewAssessment">View assessment</v-btn>
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/common/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import RelatedApplicationChanged from "@/components/common/applicationTracker/RelatedApplicationChanged.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { AssessmentTriggerType } from "@/types";
import { defineComponent, PropType } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
    RelatedApplicationChanged,
  },
  props: {
    assessmentTriggerType: {
      type: String as PropType<AssessmentTriggerType>,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const goToViewAssessment = () => {
      router.push({
        name: StudentRoutesConst.ASSESSMENT_AWARD_VIEW,
        params: {
          applicationId: props.applicationId,
          assessmentId: props.assessmentId,
        },
      });
    };
    return { AssessmentTriggerType, goToViewAssessment };
  },
});
</script>
