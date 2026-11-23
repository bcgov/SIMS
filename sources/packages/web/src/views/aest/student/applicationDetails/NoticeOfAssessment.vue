<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        subTitle="Notice of Assessment"
        :routeLocation="{
          name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW,
          params: { applicationId, studentId, assessmentId },
        }"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <notice-of-assessment-form-view :assessment-id="assessmentId" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: {
    NoticeOfAssessmentFormView,
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
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      AESTRoutesConst,
    };
  },
});
</script>
