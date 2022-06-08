<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Submission"
        :routeLocation="assessmentsSummaryRoute"
      />
    </template>
    <formio
      formName="studentExceptions"
      :readOnly="readOnly"
      :data="approvalData"
    ></formio>
  </full-page-container>
</template>
<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import { StudentAppealRequest, ApplicationExceptionStatus } from "@/types";

export default {
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
  setup(props: any) {
    const router = useRouter();
    //const toast = useToastMessage();
    const studentAppealRequests = ref([] as StudentAppealRequest[]);
    const applicationExceptionStatus = ref(ApplicationExceptionStatus.Pending);
    const readOnly = computed(
      () =>
        applicationExceptionStatus.value !== ApplicationExceptionStatus.Pending,
    );

    onMounted(async () => {
      const applicationException =
        await ApplicationExceptionService.shared.getExceptionById(
          props.exceptionId,
        );
      applicationExceptionStatus.value = applicationException.exceptionStatus;
    });

    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    const gotToAssessmentsSummary = () => {
      router.push(assessmentsSummaryRoute);
    };

    const submitted = async (approvals: any) => {
      console.log(approvals);
      // try {
      //   await StudentAppealService.shared.approveStudentAppealRequests(
      //     props.appealId,
      //     approvals,
      //   );
      //   toast.success(
      //     "Student request completed",
      //     "The request was completed with success.",
      //   );
      //   gotToAssessmentsSummary();
      // } catch (error: unknown) {
      //   if (error instanceof ApiProcessError) {
      //     if (error.errorType === ASSESSMENT_ALREADY_IN_PROGRESS) {
      //       toast.warn("Not able to submit", error.message);
      //       return;
      //     }
      //   }
      //   toast.error(
      //     "Unexpected error",
      //     "An unexpected error happened during the approval.",
      //   );
      // }
    };

    return {
      gotToAssessmentsSummary,
      assessmentsSummaryRoute,
      studentAppealRequests,
      submitted,
      readOnly,
    };
  },
};
</script>
