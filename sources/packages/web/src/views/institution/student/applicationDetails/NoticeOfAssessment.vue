<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        subTitle="Notice of Assessment"
        :routeLocation="{
          name: InstitutionRoutesConst.ASSESSMENT_AWARD_VIEW,
          params: { applicationId, studentId, assessmentId },
        }"
      />
    </template>
    <notice-of-assessment-form-view
      :assessment-id="assessmentId"
      :student-id="studentId"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
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
  setup() {
    return { InstitutionRoutesConst };
  },
});
</script>
