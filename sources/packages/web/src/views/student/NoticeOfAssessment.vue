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
    <notice-of-assessment-form-view :assessmentId="assessmentId" />
    <v-row class="justify-center mt-4">
      <v-btn color="primary" @click="confirmAssessment()">
        Confirmation of assessment
      </v-btn>
    </v-row>
  </student-page-container>
</template>

<script lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { useToastMessage } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import useEmitter from "@/composables/useEmitter";

export default {
  components: {
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
    const emitter = useEmitter();
    const toast = useToastMessage();
    const confirmAssessment = async () => {
      try {
        await StudentAssessmentsService.shared.confirmAssessmentNOA(
          props.assessmentId,
        );
        emitter.emit(
          "snackBar",
          toast.success1("Confirmation of Assessment completed successfully!"),
        );
      } catch (error) {
        emitter.emit(
          "snackBar",
          toast.error1("An error happened while confirming the assessment."),
        );
      }
    };

    return { confirmAssessment, StudentRoutesConst };
  },
};
</script>
