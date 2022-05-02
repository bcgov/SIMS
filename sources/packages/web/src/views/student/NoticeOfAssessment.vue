<template>
  <v-container>
    <div class="mb-4">
      <header-navigator title="Assessment" subTitle="Notice of Assessment" />
    </div>
    <full-page-container>
      <notice-of-assessment-form-view :assessmentId="assessmentId" />
      <v-btn color="primary" @click="confirmAssessment()">
        <v-icon size="25">mdi-text-box-plus</v-icon>
        Confirmation of Assessment
      </v-btn>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { useToastMessage } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";

export default {
  components: { NoticeOfAssessmentFormView },
  props: {
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

    return { confirmAssessment };
  },
};
</script>
