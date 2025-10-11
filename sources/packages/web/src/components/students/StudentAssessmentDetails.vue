<template>
  <request-assessment
    class="mb-5"
    :application-id="applicationId"
    :show-when-empty="false"
    @view-student-appeal="goToStudentAppeal"
    @view-student-application-offering-change="
      goToStudentApplicationOfferingChangeRequest
    "
  />
  <history-assessment
    class="mb-5"
    :application-id="applicationId"
    :view-request-types="studentAssessmentRequestTypes"
    @view-student-appeal="goToStudentAppeal"
    @view-student-application-offering-change="
      goToStudentApplicationOfferingChangeRequest
    "
    @view-assessment="goToViewAssessment"
    @view-scholastic-standing-change="goToScholasticStanding"
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
      AssessmentTriggerType.ScholasticStandingChange,
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
        name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL_REQUEST,
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

    const goToScholasticStanding = (scholasticStandingId: number) => {
      router.push({
        name: StudentRoutesConst.SCHOLASTIC_STANDING_VIEW,
        params: {
          applicationId: props.applicationId,
          scholasticStandingId,
        },
      });
    };

    return {
      goToViewAssessment,
      goToStudentAppeal,
      goToStudentApplicationOfferingChangeRequest,
      studentAssessmentRequestTypes,
      goToScholasticStanding,
    };
  },
});
</script>
