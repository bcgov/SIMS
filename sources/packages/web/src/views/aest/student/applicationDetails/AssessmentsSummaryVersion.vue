<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Application history"
        :route-location="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        sub-title="Assessments"
      />
      <application-header-title :application-id="versionApplicationId" />
    </template>
    <request-assessment
      class="mb-5"
      :application-id="versionApplicationId"
      @view-student-appeal="goToStudentAppeal"
      @view-student-application-offering-change="
        goToStudentApplicationOfferingChangeRequest
      "
      @view-application-exception="goToApplicationException"
      @view-offering-request="goToOfferingRequest"
    />
    <history-assessment
      class="mb-5"
      :application-id="versionApplicationId"
      :view-request-types="assessmentRequestTypes"
      @view-student-appeal="goToStudentAppeal"
      @view-student-application-offering-change="
        goToStudentApplicationOfferingChangeRequest
      "
      @view-assessment="gotToViewAssessment"
      @view-offering-request="goToOfferingRequest"
      @view-application-exception="goToApplicationException"
      @view-scholastic-standing-change="goToScholasticStanding"
    />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { defineComponent } from "vue";
import { AssessmentTriggerType } from "@/types";
import RequestAssessment from "@/components/common/students/assessment/Request.vue";
import HistoryAssessment from "@/components/common/students/assessment/History.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import { useFeatureToggles } from "@/composables";

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
    versionApplicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const { isFormSubmissionEnabled } = useFeatureToggles();

    // The assessment trigger types for which the request form must be visible by default.
    const assessmentRequestTypes = [
      AssessmentTriggerType.StudentAppeal,
      AssessmentTriggerType.OfferingChange,
      AssessmentTriggerType.ScholasticStandingChange,
      AssessmentTriggerType.OriginalAssessment,
      AssessmentTriggerType.ApplicationOfferingChange,
    ];

    const getDefaultVersionParameters = () => ({
      studentId: props.studentId,
      applicationId: props.applicationId,
      versionApplicationId: props.versionApplicationId,
    });

    const goToStudentAppeal = (id: number) => {
      if (isFormSubmissionEnabled.value) {
        router.push({
          name: AESTRoutesConst.STUDENT_APPLICATION_FORM_SUBMISSION_APPROVAL,
          params: {
            formSubmissionId: id,
          },
        });
        return;
      }
      router.push({
        name: AESTRoutesConst.STUDENT_APPLICATION_APPEAL_REQUESTS_APPROVAL_VERSION,
        params: {
          ...getDefaultVersionParameters(),
          appealId: id,
        },
      });
    };

    const goToApplicationException = (exceptionId: number) => {
      router.push({
        name: AESTRoutesConst.APPLICATION_EXCEPTIONS_APPROVAL_VERSION,
        params: {
          ...getDefaultVersionParameters(),
          exceptionId,
        },
      });
    };

    const gotToViewAssessment = (assessmentId: number) => {
      router.push({
        name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW_VERSION,
        params: {
          ...getDefaultVersionParameters(),
          assessmentId,
        },
      });
    };

    const goToScholasticStanding = (scholasticStandingId: number) => {
      router.push({
        name: AESTRoutesConst.SCHOLASTIC_STANDING_VIEW_VERSION,
        params: {
          ...getDefaultVersionParameters(),
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
        name: AESTRoutesConst.STUDENT_APPLICATION_OFFERING_CHANGE_REQUEST_VERSION,
        params: {
          ...getDefaultVersionParameters(),
          applicationOfferingChangeRequestId,
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
      assessmentRequestTypes,
      goToStudentApplicationOfferingChangeRequest,
    };
  },
});
</script>
