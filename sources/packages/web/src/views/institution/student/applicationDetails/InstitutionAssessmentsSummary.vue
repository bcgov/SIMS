<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Student applications"
        :route-location="backRoute"
        sub-title="Assessments"
      />
      <application-header-title
        :application-id="applicationId"
        :student-id="studentId"
      />
    </template>
    <request-assessment
      class="mb-5"
      :application-id="applicationId"
      :student-id="studentId"
      :view-request-types="historyRequestTypes"
      @view-student-appeal="goToStudentAppeal"
      @view-application-exception="goToApplicationException"
    />
    <history-assessment
      :application-id="applicationId"
      :student-id="studentId"
      :view-request-types="assessmentRequestTypes"
      @view-student-appeal="goToStudentAppeal"
      @view-assessment="gotToViewAssessment"
      @view-application-exception="goToApplicationException"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { defineComponent, computed } from "vue";
import { AssessmentTriggerType } from "@/types";
import { RequestAssessmentTypeAPIOutDTO } from "@/services/http/dto";
import RequestAssessment from "@/components/common/students/assessment/Request.vue";
import HistoryAssessment from "@/components/common/students/assessment/History.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: {
    RequestAssessment,
    HistoryAssessment,
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
  },
  setup(props) {
    const router = useRouter();

    const historyRequestTypes = [
      RequestAssessmentTypeAPIOutDTO.StudentException,
      RequestAssessmentTypeAPIOutDTO.OfferingRequest,
      RequestAssessmentTypeAPIOutDTO.ApplicationOfferingChangeRequest,
    ];

    // The assessment trigger types for which the request form must be visible by default.
    const assessmentRequestTypes = [AssessmentTriggerType.OriginalAssessment];

    const goToStudentAppeal = (appealId: number) => {
      router.push({
        name: InstitutionRoutesConst.STUDENT_APPLICATION_APPEAL_REQUESTS_APPROVAL,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          appealId,
        },
      });
    };

    const goToApplicationException = (exceptionId: number) => {
      router.push({
        name: InstitutionRoutesConst.APPLICATION_EXCEPTION,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          exceptionId,
        },
      });
    };

    const gotToViewAssessment = (assessmentId: number) => {
      router.push({
        name: InstitutionRoutesConst.ASSESSMENT_AWARD_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          assessmentId,
        },
      });
    };

    const backRoute = computed(() => ({
      name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
      params: {
        studentId: props.studentId,
      },
    }));

    return {
      InstitutionRoutesConst,
      goToStudentAppeal,
      gotToViewAssessment,
      goToApplicationException,
      backRoute,
      AssessmentTriggerType,
      historyRequestTypes,
      assessmentRequestTypes,
    };
  },
});
</script>
