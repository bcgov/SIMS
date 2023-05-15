<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application details"
        subTitle="View Request"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: applicationId,
          },
        }"
      />
    </template>
    <body-header title="Student change">
      <template #status-chip>
        <status-chip-requested-assessment
          :status="appealStatus"
        ></status-chip-requested-assessment>
      </template>
    </body-header>
    <!-- Show approval details must always be false for student view. -->
    <appeal-requests-approval-form
      :studentAppealRequests="studentAppealRequests"
      :readOnly="true"
      :showApprovalDetails="false"
    />
  </student-page-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealService } from "@/services/StudentAppealService";
import { StudentAppealRequest, StudentAppealStatus } from "@/types";
import AppealRequestsApprovalForm from "@/components/aest/AppealRequestsApprovalForm.vue";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import { StudentAppealRequestAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";

export default defineComponent({
  components: {
    AppealRequestsApprovalForm,
    StatusChipRequestedAssessment,
  },
  props: {
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
    const studentAppealRequests = ref<StudentAppealRequest[]>([]);
    const appealStatus = ref(StudentAppealStatus.Pending);

    onMounted(async () => {
      const appeal =
        await StudentAppealService.shared.getStudentAppealWithRequests<StudentAppealRequestAPIOutDTO>(
          props.appealId,
        );
      studentAppealRequests.value =
        appeal.appealRequests.map<StudentAppealRequest>((request) => ({
          id: request.id,
          data: request.submittedData,
          formName: request.submittedFormName,
        }));
      appealStatus.value = appeal.status;
    });

    return {
      StudentRoutesConst,
      studentAppealRequests,
      appealStatus,
    };
  },
});
</script>
