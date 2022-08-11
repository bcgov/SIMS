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
              data-cy="cancelApprovalRequestButton"
              @click="gotToAssessmentsSummary"
              >Cancel</v-btn
            >
            <check-permission-role :role="Role.StudentApproveDeclineAppeals">
              <template #="{ notAllowed }">
                <v-btn
                  color="primary"
                  class="ml-2"
                  data-cy="completeStudentRequest"
                  @click="submit"
                  :disabled="notAllowed"
                  >Complete student request
                </v-btn>
              </template>
            </check-permission-role>
          </v-row>
        </template>
      </appeal-requests-approval-form>
    </full-page-container>
  </v-container>
</template>
<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { StudentAppealService } from "@/services/StudentAppealService";
import { useFormatters, useSnackBar } from "@/composables";
import {
  StudentAppealRequest,
  StudentAppealApproval,
  StudentAppealStatus,
  ApiProcessError,
  Role,
} from "@/types";
import AppealRequestsApprovalForm from "@/components/aest/AppealRequestsApprovalForm.vue";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import { ASSESSMENT_ALREADY_IN_PROGRESS } from "@/services/http/dto/Assessment.dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: {
    AppealRequestsApprovalForm,
    StatusChipRequestedAssessment,
    CheckPermissionRole,
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

    const snackBar = useSnackBar();
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
          showAudit: request.appealStatus !== StudentAppealStatus.Pending,
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
        snackBar.success("The request was completed with success.");

        gotToAssessmentsSummary();
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
      gotToAssessmentsSummary,
      assessmentsSummaryRoute,
      studentAppealRequests,
      submitted,
      appealStatus,
      readOnly,
      Role,
    };
  },
};
</script>
