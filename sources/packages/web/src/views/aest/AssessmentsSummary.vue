<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Student applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Assessment"
      />
    </template>
    <RequestAssessment
      :applicationId="applicationId"
      @viewStudentAppeal="goToStudentAppeal"
      @viewApplicationException="goToApplicationException"
    />
    <HistoryAssessment
      :applicationId="applicationId"
      @viewStudentAppeal="goToStudentAppeal"
      @viewAssessment="gotToViewAssessment"
      @viewApplicationException="goToApplicationException"
    />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import RequestAssessment from "@/components/aest/students/assessment/Request.vue";
import HistoryAssessment from "@/components/aest/students/assessment/History.vue";

export default {
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
  setup(props: any) {
    const router = useRouter();

    const goToStudentAppeal = (appealId: number) => {
      router.push({
        name: AESTRoutesConst.STUDENT_APPEAL_REQUESTS_APPROVAL,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          appealId,
        },
      });
    };

    const goToApplicationException = (exceptionId: number) => {
      router.push({
        name: AESTRoutesConst.APPLICATION_EXCEPTIONS_APPROVAL,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          exceptionId,
        },
      });
    };

    const gotToViewAssessment = (assessmentId: number) => {
      router.push({
        name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          assessmentId,
        },
      });
    };

    return {
      AESTRoutesConst,
      goToStudentAppeal,
      gotToViewAssessment,
      goToApplicationException,
    };
  },
};
</script>
