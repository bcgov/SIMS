<template>
  <full-page-container v-if="!hideView">
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
      @set-hide-view="setHideView"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
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
    const hideView = ref(false);
    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.ASSESSMENT_AWARD_VIEW,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
        assessmentId: props.assessmentId,
      },
    }));

    const setHideView = (value: boolean) => {
      hideView.value = value;
    };
    return { routeLocation, hideView, setHideView };
  },
});
</script>
