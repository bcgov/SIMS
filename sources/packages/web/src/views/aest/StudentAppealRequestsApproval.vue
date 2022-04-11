<template>
  <v-container>
    <div class="mb-4">
      <header-navigator
        title="Assessment"
        subTitle="View Request"
        :routeLocation="assessmentsSummaryRoute"
      />
    </div>
    <full-page-container>
      <body-header title="Student change">
        <template #status-chip>
          <status-chip-requested-assessment
            :status="appealStatus"
          ></status-chip-requested-assessment>
        </template>
      </body-header>
      <appeal-requests-approval-form
        :studentAppealRequests="studentAppealRequests"
        :readOnly="readOnly"
        @submitted="submitted"
      >
        <template #approval-actions="{ submit }" v-if="!readOnly">
          <v-row justify="center" class="m-2">
            <v-btn
              color="primary"
              variant="outlined"
              class="mr-2"
              @click="gotToAssessmentsSummary"
              >Cancel</v-btn
            >
            <v-btn color="primary" class="ml-2" @click="submit"
              >Complete student request</v-btn
            ></v-row
          >
        </template>
      </appeal-requests-approval-form>
    </full-page-container>
  </v-container>
</template>
<script lang="ts">
import { ref, onMounted, computed } from "vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { StudentAppealService } from "@/services/StudentAppealService";
import { useFormatters, useToastMessage } from "@/composables";
import {
  StudentAppealRequest,
  StudentAppealApproval,
  StudentAppealStatus,
  ApiProcessError,
} from "@/types";
import AppealRequestsApprovalForm from "@/components/aest/AppealRequestsApprovalForm.vue";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import { ASSESSMENT_ALREADY_IN_PROGRESS } from "@/services/http/dto/Assessment.dto";

export default {
  components: {
    HeaderNavigator,
    FullPageContainer,
    BodyHeader,
    AppealRequestsApprovalForm,
    StatusChipRequestedAssessment,
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
  setup(props: any) {
    const router = useRouter();
    const toast = useToastMessage();
    const { dateOnlyLongString } = useFormatters();
    const studentAppealRequests = ref([] as StudentAppealRequest[]);
    const appealStatus = ref(StudentAppealStatus.Pending);
    const readOnly = computed(
      () => appealStatus.value !== StudentAppealStatus.Pending,
    );

    onMounted(async () => {
      const appeal =
        await StudentAppealService.shared.getStudentAppealWithRequests(
          props.appealId,
        );
      studentAppealRequests.value = appeal.appealRequests.map((request) => ({
        id: request.id,
        data: request.submittedData,
        formName: request.submittedFormName,
        approval: {
          id: request.id,
          appealStatus: request.appealStatus,
          assessedDate: dateOnlyLongString(request.assessedDate),
          assessedByUserName: request.assessedByUserName,
          noteDescription: request.noteDescription ?? "",
          showAudit: false,
        },
      }));
      appealStatus.value = appeal.status;
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

    const submitted = async (approvals: StudentAppealApproval[]) => {
      try {
        await StudentAppealService.shared.approveStudentAppealRequests(
          props.appealId,
          approvals,
        );
        toast.success(
          "Student request completed",
          "The request was completed with success.",
        );
        gotToAssessmentsSummary();
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (error.errorType === ASSESSMENT_ALREADY_IN_PROGRESS) {
            toast.warn("Not able to submit", error.message);
            return;
          }
        }
        toast.error(
          "Unexpected error",
          "An unexpected error happened during the approval.",
        );
      }
    };

    return {
      gotToAssessmentsSummary,
      assessmentsSummaryRoute,
      studentAppealRequests,
      submitted,
      appealStatus,
      readOnly,
    };
  },
};
</script>
