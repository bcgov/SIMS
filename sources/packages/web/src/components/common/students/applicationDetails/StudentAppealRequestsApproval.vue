<template>
  <body-header title="Student change requests">
    <template #status-chip>
      <status-chip-requested-assessment :status="appealStatus" />
    </template>
  </body-header>
  <div>
    <p>
      <strong>Instructions:</strong>
      <br />
    </p>
    <ul>
      <li>
        View the change request and any supporting documentation on the student
        application
      </li>
      <li>
        Review the history of Request a Change submissions prior to approving
        each new one to ensure continuity
      </li>
      <li>
        Review all fields to ensure that information is consistent with the
        students current circumstances
      </li>
      <li>
        When the review is complete, come back to this page to approve or deny
        the request
      </li>
    </ul>
    <p></p>
  </div>
  <appeal-requests-approval-form
    :studentAppealRequests="studentAppealRequests"
    :readOnly="readOnly"
    :showApprovalDetails="showApprovalDetails"
    @submitted="$emit('submitted', $event)"
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
</template>

<script lang="ts">
import { ref, onMounted, computed, defineComponent, PropType } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import { StudentAppealService } from "@/services/StudentAppealService";
import { useFormatters } from "@/composables";
import {
  StudentAppealRequest,
  StudentAppealStatus,
  Role,
  StudentAppealApproval,
} from "@/types";
import AppealRequestsApprovalForm from "@/components/aest/AppealRequestsApprovalForm.vue";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { DetailedStudentAppealRequestAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  emits: {
    submitted: (approvals: StudentAppealApproval[]) => {
      return !!approvals.length;
    },
  },
  components: {
    AppealRequestsApprovalForm,
    StatusChipRequestedAssessment,
    CheckPermissionRole,
  },
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    appealId: {
      type: Number,
      required: true,
    },
    backRouteLocation: {
      type: Object as PropType<RouteLocationRaw>,
      required: false,
    },
    readOnlyForm: {
      type: Boolean,
      required: false,
      default: false,
    },
    showApprovalDetails: {
      type: Boolean,
      required: false,
      default: false,
    },
    applicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const studentAppealRequests = ref([] as StudentAppealRequest[]);
    const appealStatus = ref(StudentAppealStatus.Pending);

    const readOnly = computed(
      () =>
        appealStatus.value !== StudentAppealStatus.Pending ||
        props.readOnlyForm,
    );

    onMounted(async () => {
      const appeal =
        await StudentAppealService.shared.getStudentAppealWithRequests<DetailedStudentAppealRequestAPIOutDTO>(
          props.appealId,
          props.studentId,
          props.applicationId,
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

    const gotToAssessmentsSummary = () => {
      if (props.backRouteLocation) {
        router.push(props.backRouteLocation);
      }
    };

    return {
      gotToAssessmentsSummary,
      studentAppealRequests,
      appealStatus,
      readOnly,
      Role,
    };
  },
});
</script>
