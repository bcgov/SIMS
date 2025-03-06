<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Student applications"
        :routeLocation="backRoute"
        subTitle="Assessment"
      />
    </template>
    <request-assessment
      class="mb-5"
      :applicationId="applicationId"
      :studentId="studentId"
      @viewStudentAppeal="goToStudentAppeal"
      @viewApplicationException="goToApplicationException"
    />
    <history-assessment
      :applicationId="applicationId"
      :studentId="studentId"
      :viewRequestTypes="assessmentRequestViewTypes"
      @viewStudentAppeal="goToStudentAppeal"
      @viewAssessment="gotToViewAssessment"
      @viewApplicationException="goToApplicationException"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { defineComponent, computed } from "vue";
import { AssessmentTriggerType } from "@/types";
import RequestAssessment from "@/components/common/students/assessment/Request.vue";
import HistoryAssessment from "@/components/common/students/assessment/History.vue";

export default defineComponent({
  components: {
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
  setup(props) {
    const router = useRouter();

    // The assessment trigger types for which the request form must be visible by default.
    const assessmentRequestViewTypes = [
      AssessmentTriggerType.StudentAppeal,
      AssessmentTriggerType.OriginalAssessment,
    ];

    const goToStudentAppeal = (appealId: number) => {
      router.push({
        name: InstitutionRoutesConst.STUDENT_APPEAL_REQUEST,
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
      assessmentRequestViewTypes,
      backRoute,
    };
  },
});
</script>
