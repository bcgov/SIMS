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
              color="danger"
              variant="elevated"
              data-cy="cancelApplication"
              @click="confirmCancelApplication"
              >Cancel application</v-btn
            ><v-btn
              v-if="assessmentId === currentAssessmentId"
              class="ml-2"
              color="primary"
              data-cy="AcceptAssessment"
              @click="confirmAssessment()"
              :disabled="!canAcceptAssessment"
              >Accept assessment</v-btn
            >
          </v-row>
        </template>
      </header-navigator>
    </template>
    <template #alerts>
      <banner
        class="mb-2"
        header="Your assessment cannot be accepted yet"
        :type="BannerTypes.Warning"
        v-if="showAcceptAssessmentWarnings"
      >
        <template #content>
          <ul>
            <li v-if="eCertValidation.disabilityStatusNotConfirmed">
              Your account has not been approved for disability funding. You
              will not be able to accept this assessment until your disability
              status is approved. If you would like to receive all
              non-disability funding, please edit the disability question on
              your application. Please note that once you have received funding
              for this application, additional changes to the disability
              question may not be considered.
            </li>
            <li v-if="eCertValidation.msfaaInvalid">
              Your MSFAA is not valid. Please complete your MSFAA with the
              National Student Loans Centre to move forward with your
              application. Please note, there is a one day delay between signing
              your MSFAA and being able to accept your assessment.
            </li>
            <li v-if="eCertValidation.hasStopDisbursementRestriction">
              You have restrictions that block funding on your account. Please
              resolve them in order to move forward with your application.
            </li>
            <li v-if="eCertValidation.noEstimatedAwardAmounts">
              Your application has been assessed and no funding has been
              awarded. If you believe this is an error, please review your
              application to ensure it is accurate or contact
              <a
                href="mailto:studentaidbc@gov.bc.ca"
                rel="noopener"
                target="_blank"
                >StudentAid BC</a
              >.
            </li>
          </ul>
        </template>
      </banner>
    </template>
    <notice-of-assessment-form-view
      :assessmentId="assessmentId"
      :canAcceptAssessment="canAcceptAssessment"
      :currentAssessmentId="currentAssessmentId"
      :viewOnly="viewOnly"
      @assessmentDataLoaded="assessmentDataLoaded"
      @confirmCancelApplication="confirmCancelApplication"
      @confirmAssessment="confirmAssessment"
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
import { computed, defineComponent, onMounted, ref } from "vue";
import {
  ApplicationStatus,
  AssessmentStatus,
  ClientIdType,
  BannerTypes,
  ECertFailedValidation,
} from "@/types";
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
    const currentAssessmentId = ref(0);
    const canAcceptAssessment = ref(false);
    const eCertValidation = ref({
      disabilityStatusNotConfirmed: false,
      msfaaInvalid: false,
      hasStopDisbursementRestriction: false,
      noEstimatedAwardAmounts: false,
    });

    /**
     * Checks if the conditions to display the 'Accept assessment' button were
     * satisfied but the button will be disabled due to some e-Cert warning.
     */
    const showAcceptAssessmentWarnings = computed(() => {
      return (
        // Is the current assessment.
        props.assessmentId === currentAssessmentId.value &&
        // Should display the 'Accept assessment' button.
        !viewOnly.value &&
        // Has some e-Cert warning preventing to accept the assessment.
        !canAcceptAssessment.value
      );
    });

    const assessmentDataLoaded = (
      applicationStatus: ApplicationStatus,
      noaApprovalStatus: AssessmentStatus,
      applicationCurrentAssessmentId: number,
    ) => {
      viewOnly.value = !(
        applicationStatus === ApplicationStatus.Assessment &&
        noaApprovalStatus === AssessmentStatus.required
      );
      currentAssessmentId.value = applicationCurrentAssessmentId;
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
    onMounted(async () => {
      const warnings =
        await StudentAssessmentsService.shared.getApplicationWarnings(
          props.applicationId,
        );
      canAcceptAssessment.value = warnings.canAcceptAssessment;
      eCertValidation.value = {
        disabilityStatusNotConfirmed: warnings.eCertFailedValidations.includes(
          ECertFailedValidation.DisabilityStatusNotConfirmed,
        ),
        msfaaInvalid:
          warnings.eCertFailedValidations.includes(
            ECertFailedValidation.MSFAACanceled,
          ) ||
          warnings.eCertFailedValidations.includes(
            ECertFailedValidation.MSFAANotSigned,
          ),
        hasStopDisbursementRestriction:
          warnings.eCertFailedValidations.includes(
            ECertFailedValidation.HasStopDisbursementRestriction,
          ),
        noEstimatedAwardAmounts: warnings.eCertFailedValidations.includes(
          ECertFailedValidation.NoEstimatedAwardAmounts,
        ),
      };
    });

    return {
      BannerTypes,
      confirmAssessment,
      StudentRoutesConst,
      assessment,
      ApplicationStatus,
      AssessmentStatus,
      ClientIdType,
      viewOnly,
      currentAssessmentId,
      confirmCancelApplication,
      cancelApplicationModal,
      assessmentDataLoaded,
      eCertValidation,
      canAcceptAssessment,
      showAcceptAssessmentWarnings,
    };
  },
});
</script>
computed,
