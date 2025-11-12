<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        sub-title="View Assessment"
        :route-location="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY_VERSION,
          params: { applicationId, studentId, versionApplicationId },
        }"
      />
      <application-header-title :application-id="versionApplicationId" />
    </template>
    <assessment-award
      :assessment-award-data="assessmentAwardData"
      :notice-of-assessment-route="noticeOfAssessmentRoute"
      :allow-confirm-enrolment="false"
      :allow-disbursement-cancellation="false"
      :allow-final-award-extended-information="true"
    />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ref, defineComponent, computed, watchEffect } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import AssessmentAward from "@/components/common/students/applicationDetails/AssessmentAward.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: { AssessmentAward, ApplicationHeaderTitle },
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
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentAwardData = ref<AwardDetailsAPIOutDTO>();

    const loadAssessmentAwardValues = async () => {
      assessmentAwardData.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
        );
    };

    watchEffect(loadAssessmentAwardValues);

    const noticeOfAssessmentRoute = computed(() => ({
      name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW_VERSION,
      params: {
        studentId: props.studentId,
        applicationId: props.applicationId,
        versionApplicationId: props.versionApplicationId,
        assessmentId: props.assessmentId,
      },
    }));

    return {
      AESTRoutesConst,
      noticeOfAssessmentRoute,
      assessmentAwardData,
      loadAssessmentAwardValues,
    };
  },
});
</script>
