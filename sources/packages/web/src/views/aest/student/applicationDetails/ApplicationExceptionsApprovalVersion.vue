<template>
  <application-exceptions-approval
    :exception-id="exceptionId"
    :application-id="versionApplicationId"
    :back-route-location="assessmentsSummaryRoute"
    :show-staff-approval="true"
    :read-only-form="true"
  />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationExceptionsApproval from "@/components/common/students/applicationDetails/ApplicationExceptionsApproval.vue";

export default defineComponent({
  components: {
    ApplicationExceptionsApproval,
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
    exceptionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY_DETAILS_VERSION,
      params: {
        studentId: props.studentId,
        applicationId: props.applicationId,
        versionApplicationId: props.versionApplicationId,
      },
    };

    return {
      assessmentsSummaryRoute,
    };
  },
});
</script>
