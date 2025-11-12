<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        sub-title="View request(s)"
        :route-location="assessmentsSummaryRoute"
      />
      <application-header-title :application-id="versionApplicationId" />
    </template>
    <student-appeal-requests-approval
      :appeal-id="appealId"
      :back-route-location="assessmentsSummaryRoute"
      :show-approval-details="true"
      :read-only-form="true"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: {
    StudentAppealRequestsApproval,
    ApplicationHeaderTitle,
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
    versionApplicationId: {
      type: Number,
      required: true,
    },
    appealId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY_VERSION,
      params: {
        studentId: props.studentId,
        applicationId: props.applicationId,
        versionApplicationId: props.versionApplicationId,
      },
    };

    return {
      assessmentsSummaryRoute,
    };
  },
});
</script>
