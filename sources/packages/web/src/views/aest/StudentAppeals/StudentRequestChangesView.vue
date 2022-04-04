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
      <body-header title="Student change"></body-header>
      <student-request-change-form-approval
        :studentAppealRequests="studentAppealRequests"
        @submitted="submitted"
      >
        <template #approval-actions="{ submit }">
          <div class="mt-4">
            <v-btn color="primary" outlined @click="gotToAssessmentsSummary"
              >Cancel</v-btn
            >
            <v-btn class="primary-btn-background" @click="submit"
              >Complete student request</v-btn
            >
          </div>
        </template>
      </student-request-change-form-approval>
    </full-page-container>
  </v-container>
</template>
<script lang="ts">
import { ref, onMounted } from "vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { StudentAppealService } from "@/services/StudentAppealService";
import { useFormatters } from "@/composables";
import { StudentAppealRequest } from "@/components/common/StudentRequestChange/StudentRequestChange.models";
import StudentRequestChangeFormApproval from "@/components/common/StudentRequestChange/StudentRequestChangeFormApproval.vue";

export default {
  components: {
    HeaderNavigator,
    FullPageContainer,
    BodyHeader,
    StudentRequestChangeFormApproval,
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
    const { dateOnlyLongString } = useFormatters();
    const studentAppealRequests = ref([] as StudentAppealRequest[]);

    onMounted(async () => {
      const appeal = await StudentAppealService.shared.getStudentAppealWithRequests(
        props.appealId,
      );
      studentAppealRequests.value = appeal.appealRequests.map(request => ({
        id: request.id,
        data: request.submittedData,
        formName: request.submittedFormName,
        approval: {
          appealStatus: request.appealStatus,
          assessedDate: dateOnlyLongString(request.assessedDate),
          assessedByUserName: request.assessedByUserName,
          noteDescription: request.noteDescription,
          showAudit: false,
        },
      }));
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

    const submitted = () => {
      console.log("submitted");
    };

    return {
      AESTRoutesConst,
      gotToAssessmentsSummary,
      assessmentsSummaryRoute,
      studentAppealRequests,
      submitted,
    };
  },
};
</script>
