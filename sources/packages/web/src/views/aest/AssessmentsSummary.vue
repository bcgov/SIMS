<template>
  <header-navigator
    title="Student applications"
    :routeLocation="{
      name: AESTRoutesConst.STUDENT_APPLICATIONS,
      params: { studentId },
    }"
    subTitle="Assessment"
  />
  <RequestAssessment
    :applicationId="applicationId"
    @viewStudentAppeal="goToStudentAppeal"
  />
  <HistoryAssessment
    :applicationId="applicationId"
    @viewStudentAppeal="goToStudentAppeal"
    @viewScholasticStandingChange="goToScholasticStanding"
  />
</template>
<script lang="ts">
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
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
  setup(props: any) {
    const router = useRouter();
    const goToStudentAppeal = (appealId: number) => {
      router.push({
        name: AESTRoutesConst.STUDENT_APPEAL_REQUESTS_APPROVAL,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          appealId,
        },
      });
    };

    return {
      AESTRoutesConst,
      goToStudentAppeal,
    };
  },
};
</script>
