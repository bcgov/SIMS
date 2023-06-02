<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        subTitle="Notice of Assessment"
        :routeLocation="routeLocation"
      />
    </template>
    <notice-of-assessment-form-view
      :assessment-id="assessmentId"
      :student-id="studentId"
      :application-id="applicationId"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: {
    NoticeOfAssessmentFormView,
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
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.ASSESSMENT_AWARD_VIEW,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
        assessmentId: props.assessmentId,
      },
    }));

    return { routeLocation };
  },
});
</script>
