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
    <request-assessment
      class="mb-5"
      :applicationId="applicationId"
      @viewStudentAppeal="goToStudentAppeal"
      @viewStudentApplicationOfferingChange="
        goToStudentApplicationOfferingChangeRequest
      "
      @viewApplicationException="goToApplicationException"
      @viewOfferingRequest="goToOfferingRequest"
    />
    <manual-reassessment
      class="mb-5"
      :applicationId="applicationId"
      @reassessmentTriggered="reloadHistory"
    />
    <history-assessment
      class="mb-5"
      :applicationId="applicationId"
      :viewRequestTypes="assessmentRequestTypes"
      @viewStudentAppeal="goToStudentAppeal"
      @viewStudentApplicationOfferingChange="
        goToStudentApplicationOfferingChangeRequest
      "
      @viewAssessment="gotToViewAssessment"
      @viewOfferingRequest="goToOfferingRequest"
      @viewApplicationException="goToApplicationException"
      @viewScholasticStandingChange="goToScholasticStanding"
      :key="historyKey"
    />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { defineComponent, ref } from "vue";
import { AssessmentTriggerType } from "@/types";
import RequestAssessment from "@/components/aest/students/assessment/Request.vue";
import HistoryAssessment from "@/components/aest/students/assessment/History.vue";
import ManualReassessment from "@/components/aest/students/assessment/ManualReassessment.vue";

export default defineComponent({
  components: {
    RequestAssessment,
    HistoryAssessment,
    ManualReassessment,
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
    const historyKey = ref(0);

    // The assessment trigger types for which the request form must be visible by default.
    const assessmentRequestTypes = [
      AssessmentTriggerType.StudentAppeal,
      AssessmentTriggerType.OfferingChange,
      AssessmentTriggerType.ScholasticStandingChange,
      AssessmentTriggerType.OriginalAssessment,
      AssessmentTriggerType.ApplicationOfferingChange,
    ];

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
    const goToStudentApplicationOfferingChangeRequest = (
      applicationOfferingChangeRequestId: number,
    ) => {
      router.push({
        name: AESTRoutesConst.STUDENT_APPLICATION_OFFERING_CHANGE_REQUEST,
        params: {
          applicationOfferingChangeRequestId,
          applicationId: props.applicationId,
          studentId: props.studentId,
        },
      });
    };

    const reloadHistory = () => {
      // Changing key's component makes it to re-render/reload.
      historyKey.value++;
    };

    return {
      AESTRoutesConst,
      goToStudentAppeal,
      gotToViewAssessment,
      goToApplicationException,
      goToScholasticStanding,
      goToOfferingRequest,
      assessmentRequestTypes,
      goToStudentApplicationOfferingChangeRequest,
      historyKey,
      reloadHistory,
    };
  },
});
</script>
