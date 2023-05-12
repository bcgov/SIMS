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
      :viewRequestTypes="assessmentRequestTypes"
      @viewStudentAppeal="goToStudentAppeal"
      @viewApplicationException="goToApplicationException"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { defineComponent, computed } from "vue";
import { AssessmentTriggerType } from "@/types";
import RequestAssessment from "@/components/aest/students/assessment/Request.vue";
import HistoryAssessment from "@/components/aest/students/assessment/History.vue";

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
    const assessmentRequestTypes = [
      AssessmentTriggerType.StudentAppeal,
      AssessmentTriggerType.OfferingChange,
      AssessmentTriggerType.ScholasticStandingChange,
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

    const backRoute = computed(() => ({
      name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
      params: {
        studentId: props.studentId,
      },
    }));

    return {
      InstitutionRoutesConst,
      goToStudentAppeal,
      goToApplicationException,
      assessmentRequestTypes,
      backRoute,
    };
  },
});
</script>
