<template>
  <request-assessment
    :applicationId="applicationId"
    :showWhenEmpty="false"
    @viewStudentAppeal="goToStudentAppeal"
  />
  <history-assessment
    :applicationId="applicationId"
    :viewRequestTypes="studentAssessmentRequestTypes"
    @viewStudentAppeal="goToStudentAppeal"
    @viewAssessment="gotToViewAssessment"
  />
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { AssessmentTriggerType } from "@/types";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import HistoryAssessment from "@/components/aest/students/assessment/History.vue";
import RequestAssessment from "@/components/aest/students/assessment/Request.vue";

export default defineComponent({
  components: {
    HistoryAssessment,
    RequestAssessment,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    // The assessment trigger types for which the request form is visible to student.
    const studentAssessmentRequestTypes = [AssessmentTriggerType.StudentAppeal];

    const gotToViewAssessment = (assessmentId: number) => {
      router.push({
        name: StudentRoutesConst.ASSESSMENT_AWARD_VIEW,
        params: {
          applicationId: props.applicationId,
          assessmentId,
        },
      });
    };

    const goToStudentAppeal = (appealId: number) => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPEAL_REQUESTS,
        params: {
          applicationId: props.applicationId,
          appealId,
        },
      });
    };
    return {
      gotToViewAssessment,
      goToStudentAppeal,
      studentAssessmentRequestTypes,
    };
  },
});
</script>
