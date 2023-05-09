<template>
  <student-appeal-requests-approval
    :studentId="studentId"
    :appealId="appealId"
    :backRouteLocation="assessmentsSummaryRoute"
    :readOnlyForm="true"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";

export default defineComponent({
  components: { StudentAppealRequestsApproval },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
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
      name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };
    return {
      assessmentsSummaryRoute,
    };
  },
});
</script>
