<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application details"
        subTitle="Notice of Assessment"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: applicationId,
          },
        }"
      />
    </template>
    <template #content>
      <notice-of-assessment-form-view :assessmentId="assessmentId" />
      <v-row class="justify-center mt-4">
        <v-btn color="primary" @click="confirmAssessment()">
          Confirmation of assessment
        </v-btn>
      </v-row>
    </template>
  </student-page-container>
</template>

<script lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { useToastMessage } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentPageContainer from "@/components/layouts/student/StudentPageContainer.vue";

export default {
  components: {
    NoticeOfAssessmentFormView,
    StudentPageContainer,
  },
  props: {
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
    const toast = useToastMessage();
    const confirmAssessment = async () => {
      try {
        await StudentAssessmentsService.shared.confirmAssessmentNOA(
          props.assessmentId,
        );
        toast.success(
          "Completed!",
          "Confirmation of Assessment completed successfully!",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while confirming the assessment.",
        );
      }
    };

    return { confirmAssessment, StudentRoutesConst };
  },
};
</script>
