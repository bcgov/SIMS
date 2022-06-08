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
      :data="applicationExceptions"
    ></formio>
  </full-page-container>
</template>
<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import { ApplicationExceptionStatus } from "@/types";
import { ApplicationExceptionAPIOutDTO } from "@/services/http/dto";
import { useAssessment, useFormatters } from "@/composables";

type ApplicationExceptionFormModel = Omit<
  ApplicationExceptionAPIOutDTO,
  "assessedDate"
> & {
  showAudit: boolean;
  assessedDate: string;
  exceptionStatusClass: string;
  exceptionNames: string[];
};

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
    const { dateOnlyLongString } = useFormatters();
    const { mapRequestAssessmentChipStatus } = useAssessment();
    const applicationExceptions = ref({} as ApplicationExceptionFormModel);
    const readOnly = computed(
      () =>
        applicationExceptions.value.exceptionStatus !==
        ApplicationExceptionStatus.Pending,
    );

    onMounted(async () => {
      const applicationException =
        await ApplicationExceptionService.shared.getExceptionById(
          props.exceptionId,
        );
      applicationExceptions.value = {
        ...applicationException,
        assessedDate: dateOnlyLongString(applicationException.assessedDate),
        exceptionStatusClass: mapRequestAssessmentChipStatus(
          applicationException.exceptionStatus,
        ),
        showAudit:
          applicationException.exceptionStatus !==
          ApplicationExceptionStatus.Pending,
        exceptionNames: applicationException.exceptionRequests.map(
          (exception) => exception.exceptionName,
        ),
      };
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
      applicationExceptions,
      submitted,
      readOnly,
    };
  },
};
</script>
