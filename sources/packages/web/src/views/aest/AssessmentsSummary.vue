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
      @viewOfferingRequest="goToOfferingRequest"
    />
    <HistoryAssessment
      :applicationId="applicationId"
      @viewStudentAppeal="goToStudentAppeal"
      @viewAssessment="gotToViewAssessment"
      @viewOfferingRequest="goToOfferingRequest"
      @viewApplicationException="goToApplicationException"
      @viewScholasticStandingChange="goToScholasticStanding"
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
        name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          assessmentId,
        },
      });
    };

    const goToScholasticStanding = (scholasticStandingId: number) => {
      router.push({
        name: AESTRoutesConst.SCHOLASTIC_STANDING_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          scholasticStandingId,
        },
      });
    };
    const goToOfferingRequest = (offeringId: number, programId: number) => {
      router.push({
        name: AESTRoutesConst.OFFERING_CHANGE_REQUEST_VIEW,
        params: {
          offeringId,
          programId,
        },
      });
    };

    return {
      AESTRoutesConst,
      goToStudentAppeal,
      gotToViewAssessment,
      goToApplicationException,
      goToScholasticStanding,
      goToOfferingRequest,
    };
  },
};
</script>
