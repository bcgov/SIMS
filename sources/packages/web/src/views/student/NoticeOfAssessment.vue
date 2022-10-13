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
      :view-only="viewOnly"
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
import { computed, defineComponent, ref, watch } from "vue";
import { ApplicationStatus, AssessmentStatus } from "@/types";
import { ClientIdType } from "@/types";
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
    const setAssessment = async () => {
      assessment.value =
        await StudentAssessmentsService.shared.getAssessmentNOA(
          props.assessmentId,
        );
    };
    const confirmAssessment = async () => {
      try {
        await StudentAssessmentsService.shared.confirmAssessmentNOA(
          props.assessmentId,
        );
        await setAssessment();
        snackBar.success("Confirmation of Assessment completed successfully!");
      } catch (error) {
        snackBar.error("An error happened while confirming the assessment.");
      }
    };

    watch(
      () => props.assessmentId,
      async () => {
        await setAssessment();
      },
      { immediate: true },
    );

    const viewOnly = computed(
      () =>
        !(
          assessment.value?.applicationStatus ===
            ApplicationStatus.assessment &&
          assessment.value?.noaApprovalStatus === AssessmentStatus.required
        ),
    );

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
      confirmCancelApplication,
      cancelApplicationModal,
    };
  },
});
</script>
