<template>
  <header-navigator
    title="Back to student applications"
    :routeLocation="{
      name: AESTRoutesConst.STUDENT_APPLICATIONS,
      params: { studentId },
    }"
    subTitle="Assessment"
  />
  <RequestAssessment />
  <HistoryAssessment />
</template>
<script lang="ts">
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import RequestAssessment from "@/components/aest/students/assessment/Request.vue";
import HistoryAssessment from "@/components/aest/students/assessment/History.vue";
import { onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";

export default {
  components: {
    HeaderNavigator,
    RequestAssessment,
    HistoryAssessment,
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
  },
  setup(props: any) {
    onMounted(async () => {
      const [requestedAssessment, AssessmentHistory] = await Promise.all([
        StudentAssessmentsService.shared.getAssessmentRequest(
          props.applicationId,
        ),
        StudentAssessmentsService.shared.getAssessmentHistory(
          props.applicationId,
        ),
      ]);
      console.log(
        requestedAssessment,
        "++++++++++requestedAssessmentrequestedAssessment",
        AssessmentHistory,
      );
    });
    return {
      AESTRoutesConst,
    };
  },
};
</script>
