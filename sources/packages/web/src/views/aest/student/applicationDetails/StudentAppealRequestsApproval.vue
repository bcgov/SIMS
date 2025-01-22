<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        subTitle="View request(s)"
        :routeLocation="assessmentsSummaryRoute"
      />
    </template>
    <student-appeal-requests-approval
      :appealId="appealId"
      :backRouteLocation="assessmentsSummaryRoute"
      :showApprovalDetails="true"
      @submitted="submitted"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { StudentAppealService } from "@/services/StudentAppealService";
import { useSnackBar } from "@/composables";
import { StudentAppealApproval, ApiProcessError } from "@/types";
import { ASSESSMENT_ALREADY_IN_PROGRESS } from "@/services/http/dto/Assessment.dto";
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";

export default defineComponent({
  components: {
    StudentAppealRequestsApproval,
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
    appealId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();

    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    const submitted = async (approvals: StudentAppealApproval[]) => {
      try {
        await StudentAppealService.shared.approveStudentAppealRequests(
          props.appealId,
          approvals,
        );
        snackBar.success("The request was completed with success.");

        router.push(assessmentsSummaryRoute);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (error.errorType === ASSESSMENT_ALREADY_IN_PROGRESS) {
            snackBar.warn(error.message);
            return;
          }
        }
        snackBar.error("An unexpected error happened during the approval.");
      }
    };

    return {
      assessmentsSummaryRoute,
      submitted,
    };
  },
});
</script>
