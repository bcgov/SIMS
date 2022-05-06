<template>
  <v-container>
    <div class="mb-4">
      <header-navigator
        title="Assessment"
        subTitle="Notice of Assessment"
        :routeLocation="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: { applicationId, studentId },
        }"
      />
    </div>
  </v-container>
  <full-page-container>
    <notice-of-assessment-form-view :assessmentId="assessmentId" />
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: {
    HeaderNavigator,
    FullPageContainer,
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
    return { AESTRoutesConst };
  },
};
</script>
