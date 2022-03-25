<template>
  <header-navigator
    title="Back to student applications"
    :routeLocation="{
      name: AESTRoutesConst.STUDENT_APPLICATIONS,
      params: { studentId },
    }"
    subTitle="Assessment"
  />
  <RequestAssessment :applicationId="applicationId" />
  <HistoryAssessment :applicationId="applicationId" />
</template>
<script lang="ts">
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import RequestAssessment from "@/components/aest/students/assessment/Request.vue";
import HistoryAssessment from "@/components/aest/students/assessment/History.vue";
export default {
  components: {
    HeaderNavigator,
    RequestAssessment,
    HistoryAssessment,
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
  },
  setup() {
    return {
      AESTRoutesConst,
    };
  },
};
</script>
