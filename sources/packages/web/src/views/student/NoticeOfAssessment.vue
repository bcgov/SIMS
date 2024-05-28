<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="View assessment"
        subTitle="Assessment"
        :routeLocation="{
          name: StudentRoutesConst.ASSESSMENT_AWARD_VIEW,
          params: {
            applicationId: applicationId,
            assessmentId: assessmentId,
          },
        }"
        ><template #buttons v-if="!viewOnly">
          <v-row class="p-0 m-0">
            <v-btn
              color="primary"
              variant="outlined"
              data-cy="cancelApplication"
              @click="confirmCancelApplication"
              >Cancel application</v-btn
            ><v-btn
              v-if="assessmentId == currAssessmentId"
              class="ml-2"
              color="primary"
              data-cy="AcceptAssessment"
              @click="confirmAssessment()"
              >Accept assessment</v-btn
            >
          </v-row>
        </template>
      </header-navigator>
    </template>
    <notice-of-assessment-form-view
      :assessmentId="assessmentId"
      @assessmentDataLoaded="assessmentDataLoaded"
    />

    <cancel-application ref="cancelApplicationModal" />
  </student-page-container>
</template>

<script lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";
import { defineComponent, ref } from "vue";
import { ApplicationStatus, AssessmentStatus, ClientIdType } from "@/types";
import CancelApplication from "@/components/students/modals/CancelApplication.vue";
import { useRouter } from "vue-router";

export default defineComponent({
  components: {
    NoticeOfAssessmentFormView,
    CancelApplication,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const cancelApplicationModal = ref({} as ModalDialog<boolean>);
    const assessment = ref<AssessmentNOAAPIOutDTO>();
    const snackBar = useSnackBar();
    const viewOnly = ref(true);
    const currAssessmentId = ref(0);

    const assessmentDataLoaded = (
      applicationStatus: ApplicationStatus,
      noaApprovalStatus: AssessmentStatus,
      currentAssessmentId: number,
    ) => {
      viewOnly.value = !(
        applicationStatus === ApplicationStatus.Assessment &&
        noaApprovalStatus === AssessmentStatus.required
      );
      currAssessmentId.value = currentAssessmentId;
    };

    const confirmAssessment = async () => {
      try {
        await StudentAssessmentsService.shared.confirmAssessmentNOA(
          props.assessmentId,
        );
        viewOnly.value = true;
        snackBar.success("Confirmation of Assessment completed successfully!");
      } catch {
        snackBar.error("An error happened while confirming the assessment.");
      }
    };

    const confirmCancelApplication = async () => {
      if (await cancelApplicationModal.value.showModal(props.applicationId)) {
        return router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: props.applicationId,
          },
        });
      }
    };

    return {
      confirmAssessment,
      StudentRoutesConst,
      assessment,
      ApplicationStatus,
      AssessmentStatus,
      ClientIdType,
      viewOnly,
      currAssessmentId,
      confirmCancelApplication,
      cancelApplicationModal,
      assessmentDataLoaded,
    };
  },
});
</script>
