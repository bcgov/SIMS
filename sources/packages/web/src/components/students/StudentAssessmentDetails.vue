<template>
  <request-assessment
    class="mb-5"
    :applicationId="applicationId"
    :showWhenEmpty="false"
    @viewStudentAppeal="goToStudentAppeal"
    @viewStudentApplicationOfferingChange="
      goToStudentApplicationOfferingChangeRequest
    "
  />
  <history-assessment
    class="mb-5"
    :applicationId="applicationId"
    :viewRequestTypes="studentAssessmentRequestTypes"
    @viewStudentAppeal="goToStudentAppeal"
    @viewStudentApplicationOfferingChange="
      goToStudentApplicationOfferingChangeRequest
    "
    @viewAssessment="goToViewAssessment"
  />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { AssessmentTriggerType } from "@/types";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import HistoryAssessment from "@/components/common/students/assessment/History.vue";
import RequestAssessment from "@/components/common/students/assessment/Request.vue";

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
    const studentAssessmentRequestTypes = [
      AssessmentTriggerType.StudentAppeal,
      AssessmentTriggerType.ApplicationOfferingChange,
    ];

    const goToViewAssessment = (assessmentId: number) => {
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
        name: StudentRoutesConst.STUDENT_APPEAL_REQUEST,
        params: {
          applicationId: props.applicationId,
          appealId,
        },
      });
    };
    const goToStudentApplicationOfferingChangeRequest = (
      applicationOfferingChangeRequestId: number,
    ) => {
      router.push({
        name: StudentRoutesConst.STUDENT_REQUESTED_APPLICATION_OFFERING_CHANGE,
        params: {
          applicationOfferingChangeRequestId,
          applicationId: props.applicationId,
        },
      });
    };
    return {
      goToViewAssessment,
      goToStudentAppeal,
      goToStudentApplicationOfferingChangeRequest,
      studentAssessmentRequestTypes,
    };
  },
});
</script>
