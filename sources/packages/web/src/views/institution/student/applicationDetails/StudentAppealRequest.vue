<template>
  <full-page-container>
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
      :application-id="currentApplicationId"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";
import { ApplicationService } from "@/services/ApplicationService";

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
    const currentApplicationId = ref<number>();

    onMounted(async () => {
      // Get current application for the parent application.
      const currentApplication =
        await ApplicationService.shared.getCurrentApplicationFromParent(
          props.applicationId,
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
