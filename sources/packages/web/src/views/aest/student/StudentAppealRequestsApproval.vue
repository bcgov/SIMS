<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Appeals"
        sub-title="Appeal request"
        :route-location="pendingAppealsRoute"
      />
    </template>
    <student-appeal-requests-approval
      :appeal-id="appealId"
      :back-route-location="pendingAppealsRoute"
      :show-approval-details="true"
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
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";

export default defineComponent({
  components: {
    StudentAppealRequestsApproval,
  },
  props: {
    appealId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();

    const pendingAppealsRoute = { name: AESTRoutesConst.STUDENT_APPEALS };

    const submitted = async (approvals: StudentAppealApproval[]) => {
      debugger;
      try {
        await StudentAppealService.shared.approveStudentAppealRequests(
          props.appealId,
          approvals,
        );
        snackBar.success(
          "The student appeal request was completed with success.",
        );
        router.push(pendingAppealsRoute);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.warn(error.message);
          return;
        }
        snackBar.error("An unexpected error happened during the approval.");
      }
    };

    return {
      pendingAppealsRoute,
      submitted,
      AESTRoutesConst,
    };
  },
});
</script>
