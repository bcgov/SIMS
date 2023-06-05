<template>
  <application-exceptions-approval
    :studentId="studentId"
    :exceptionId="exceptionId"
    :backRouteLocation="assessmentsSummaryRoute"
    :readOnlyForm="true"
    :application-id="applicationId"
  />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
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
    exceptionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentsSummaryRoute = {
      name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    return {
      assessmentsSummaryRoute,
    };
  },
});
</script>
