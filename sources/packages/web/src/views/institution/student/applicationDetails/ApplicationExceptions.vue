<template>
  <application-exceptions-approval
    :studentId="studentId"
    :exceptionId="exceptionId"
    :backRouteLocation="assessmentsSummaryRoute"
    :readOnlyForm="true"
    :application-id="currentApplicationId"
  />
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationExceptionsApproval from "@/components/common/students/applicationDetails/ApplicationExceptionsApproval.vue";
import { ApplicationService } from "@/services/ApplicationService";

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
    const currentApplicationId = ref<number>();

    onMounted(async () => {
      // Get current application for the parent application.
      const currentApplication = await ApplicationService.shared.getApplication(
        props.applicationId,
        { loadDynamicData: false, isParentApplication: true },
      );
      currentApplicationId.value = currentApplication.id;
    });

    const assessmentsSummaryRoute = {
      name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    return {
      assessmentsSummaryRoute,
      currentApplicationId,
    };
  },
});
</script>
