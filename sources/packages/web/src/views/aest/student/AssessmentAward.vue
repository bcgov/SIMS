<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Financial Aid Application"
        subTitle="View Assessment"
        :routeLocation="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: { applicationId, studentId },
        }"
      />
    </template>
    <body-header
      title="Summary"
      subTitle="Below is the summary from your assessment. To view your entire assessment, click on View assessment."
    >
      <template #actions>
        <v-btn
          class="float-right"
          color="primary"
          @click="goToNoticeOfAssessment"
          >View assessment</v-btn
        >
      </template>
    </body-header>
    <assessment-award-details :assessmentAwardData="assessmentAwardData" />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import AssessmentAwardDetails from "@/components/aest/students/assessment/AssessmentAwardDetails.vue";

export default {
  components: { AssessmentAwardDetails },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const assessmentAwardData = ref<AwardDetailsAPIOutDTO>();

    onMounted(async () => {
      assessmentAwardData.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
        );
    });

    const goToNoticeOfAssessment = () => {
      return router.push({
        name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          assessmentId: props.assessmentId,
        },
      });
    };

    return { AESTRoutesConst, goToNoticeOfAssessment, assessmentAwardData };
  },
};
</script>
