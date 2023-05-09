<template>
  <application-exceptions-approval
    :exceptionId="exceptionId"
    :backRouteLocation="assessmentsSummaryRoute"
    :processing="processing"
    @submitted="submitted"
  />
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import { FormIOForm } from "@/types";
import { UpdateApplicationExceptionAPIInDTO } from "@/services/http/dto";
import { useSnackBar } from "@/composables";
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
    const router = useRouter();
    const snackBar = useSnackBar();
    const processing = ref(false);

    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };
    // todo: ann test
    const submitted = async (form: FormIOForm) => {
      processing.value = true;
      try {
        const approveExceptionPayload =
          form.data as UpdateApplicationExceptionAPIInDTO;
        await ApplicationExceptionService.shared.approveException(
          props.exceptionId,
          approveExceptionPayload,
        );
        snackBar.success(
          `Application exception status is now ${approveExceptionPayload.exceptionStatus}.`,
        );
        router.push(assessmentsSummaryRoute);
      } catch {
        snackBar.error("An unexpected error happened during the approval.");
      } finally {
        processing.value = false;
      }
    };

    return {
      assessmentsSummaryRoute,
      submitted,
      processing,
    };
  },
});
</script>
