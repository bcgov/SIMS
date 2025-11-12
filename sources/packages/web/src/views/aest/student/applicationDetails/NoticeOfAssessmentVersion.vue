<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        sub-title="Notice of Assessment"
        :route-location="{
          name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW_VERSION,
          params: {
            applicationId,
            versionApplicationId,
            studentId,
            assessmentId,
          },
        }"
      />
      <application-header-title :application-id="versionApplicationId" />
    </template>
    <notice-of-assessment-form-view
      :assessment-id="assessmentId"
      :can-reissue-m-s-f-a-a="false"
    />
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
    versionApplicationId: {
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
