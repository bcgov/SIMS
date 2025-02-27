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
      <application-header-title :application-id="currentApplicationId" />
    </template>
    <assessment-award
      :assessment-award-data="assessmentAwardData"
      :notice-of-assessment-route="noticeOfAssessmentRoute"
      :allow-confirm-enrolment="true"
      :allow-final-award-extended-information="true"
      @confirm-enrolment="confirmEnrolment"
    />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ref, onMounted, defineComponent, computed } from "vue";
import { useSnackBar } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { FIRST_COE_NOT_COMPLETE } from "@/constants";
import { ApiProcessError } from "@/types";
import AssessmentAward from "@/components/common/students/applicationDetails/AssessmentAward.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import { ApplicationService } from "@/services/ApplicationService";

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
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentAwardData = ref<AwardDetailsAPIOutDTO>();
    const snackBar = useSnackBar();
    const currentApplicationId = ref<number>();

    onMounted(async () => {
      // Get current application for the parent application.
      const currentApplication = await ApplicationService.shared.getApplication(
        props.applicationId,
        { loadDynamicData: false, isParentApplication: true },
      );
      currentApplicationId.value = currentApplication.id;
    });

    const loadAssessmentAwardValues = async () => {
      assessmentAwardData.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
        );
    };

    onMounted(loadAssessmentAwardValues);

    const noticeOfAssessmentRoute = computed(() => ({
      name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
      params: {
        studentId: props.studentId,
        applicationId: props.applicationId,
        assessmentId: props.assessmentId,
      },
    }));

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
      noticeOfAssessmentRoute,
      assessmentAwardData,
      confirmEnrolment,
      currentApplicationId,
    };
  },
});
</script>
