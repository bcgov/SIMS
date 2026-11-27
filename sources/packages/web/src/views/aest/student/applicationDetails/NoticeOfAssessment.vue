<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        sub-title="Notice of Assessment"
        :route-location="{
          name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW,
          params: { applicationId, studentId, assessmentId },
        }"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <notice-of-assessment-form-view :assessment-id="assessmentId" />
  </full-page-container>
</template>

<script setup lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

interface Props {
  studentId: number;
  applicationId: number;
  assessmentId: number;
}

defineProps<Props>();
</script>
