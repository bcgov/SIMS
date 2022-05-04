<template>
  <v-container>
    <div class="mb-4">
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
    </div>
  </v-container>
  <full-page-container>
    <notice-of-assessment-form-view :assessmentId="assessmentId" />
    <v-row class="justify-center mt-4">
      <v-btn color="primary" @click="confirmAssessment()">
        Confirmation of assessment
      </v-btn>
    </v-row>
  </full-page-container>
</template>

<script lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { useToastMessage } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: {
    FullPageContainer,
    HeaderNavigator,
    NoticeOfAssessmentFormView,
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
