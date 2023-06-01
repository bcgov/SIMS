<template>
  <full-page-container v-if="!hideView">
    <template #header>
      <header-navigator
        title="Assessment"
        subTitle="View Request"
        :routeLocation="assessmentsSummaryRoute"
      />
    </template>
    <student-appeal-requests-approval
      :studentId="studentId"
      :appealId="appealId"
      :readOnlyForm="true"
      :application-id="applicationId"
      @set-hide-view="setHideView"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";

export default defineComponent({
  components: { StudentAppealRequestsApproval },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    appealId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const hideView = ref(false);
    const assessmentsSummaryRoute = {
      name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };
    const setHideView = (value: boolean) => {
      hideView.value = value;
    };

    return {
      assessmentsSummaryRoute,
      hideView,
      setHideView,
    };
  },
});
</script>
