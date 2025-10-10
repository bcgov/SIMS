<template>
  <application-exceptions-approval
    :exception-id="exceptionId"
    :application-id="applicationId"
    :back-route-location="assessmentsSummaryRoute"
    :processing="processing"
    :show-staff-approval="true"
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
import { useFormioUtils, useSnackBar } from "@/composables";
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
    const { excludeExtraneousValues } = useFormioUtils();
    const processing = ref(false);

    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    const submitted = async (
      form: FormIOForm<UpdateApplicationExceptionAPIInDTO>,
    ) => {
      processing.value = true;
      try {
        const typedData = excludeExtraneousValues(
          UpdateApplicationExceptionAPIInDTO,
          form.data,
        );
        await ApplicationExceptionService.shared.approveException(
          props.exceptionId,
          typedData,
        );
        snackBar.success(
          "Application exception decision submitted successfully.",
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
