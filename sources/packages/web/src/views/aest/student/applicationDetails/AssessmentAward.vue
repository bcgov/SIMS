<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Assessment"
        :routeLocation="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: { applicationId, studentId },
        }"
      />
      <detail-header :headerMap="headerMap" />
    </template>
    <body-header
      title="Summary"
      subTitle="Below is the summary from your assessment. To view your entire assessment, click on View assessment."
    >
      <template #actions>
        <v-btn
          class="float-right"
          color="primary"
          prepend-icon="fa:far fa-file-lines"
          @click="goToNoticeOfAssessment"
          >View assessment</v-btn
        >
      </template>
    </body-header>
    <assessment-award-details
      :assessmentAwardData="assessmentAwardData"
      :allowConfirmEnrolment="true"
      @confirmEnrolment="confirmEnrolment"
    />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ref, onMounted, defineComponent } from "vue";
import { useAssessment, useSnackBar } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { FIRST_COE_NOT_COMPLETE } from "@/constants";
import { ApiProcessError } from "@/types";
import AssessmentAwardDetails from "@/components/common/AssessmentAwardDetails.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";

export default defineComponent({
  components: { AssessmentAwardDetails, DetailHeader },
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
  setup(props) {
    const router = useRouter();
    const assessmentAwardData = ref<AwardDetailsAPIOutDTO>();
    const { mapAssessmentDetailHeader } = useAssessment();
    const headerMap = ref<Record<string, string>>({});
    const snackBar = useSnackBar();

    const loadAssessmentAwardValues = async () => {
      assessmentAwardData.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
        );
      headerMap.value = mapAssessmentDetailHeader(assessmentAwardData.value);
    };

    onMounted(loadAssessmentAwardValues);

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

    const confirmEnrolment = async (disbursementId: number) => {
      try {
        await ConfirmationOfEnrollmentService.shared.confirmEnrollment(
          disbursementId,
        );
        snackBar.success("Confirmation of Enrollment Confirmed!");
        await loadAssessmentAwardValues();
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === FIRST_COE_NOT_COMPLETE
        ) {
          snackBar.error("First COE is not completed.");
          return;
        }
        snackBar.error("An error happened while confirming the COE.");
      }
    };

    return {
      AESTRoutesConst,
      goToNoticeOfAssessment,
      assessmentAwardData,
      headerMap,
      confirmEnrolment,
    };
  },
});
</script>
