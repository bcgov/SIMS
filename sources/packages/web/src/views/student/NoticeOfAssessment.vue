<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="View assessment"
        sub-title="Assessment"
        :route-location="{
          name: StudentRoutesConst.ASSESSMENT_AWARD_VIEW,
          params: {
            applicationId: applicationId,
            assessmentId: assessmentId,
          },
        }"
        ><template #buttons v-if="!viewOnly">
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
          <ul class="pl-0 my-2">
            <li v-if="acceptValidation.hasEffectiveAviationRestriction">
              You have already been funded for this type of aviation credential
              and are not eligible for additional funding.
            </li>
            <li v-if="acceptValidation.disabilityStatusNotConfirmed">
              Your account has not been approved for disability funding. You
              will not be able to accept this assessment until your disability
              status is approved. If you would like to receive all
              non-disability funding, please edit the disability question on
              your application. Please note that once you have received funding
              for this application, additional changes to the disability
              question may not be considered.
            </li>
            <li v-if="acceptValidation.modifiedIndependentStatusNotApproved">
              You have indicated in your application that you should be
              considered a modified independent; however, the modified
              independent status on your student profile is not approved. If you
              have not submitted one yet, please submit a modified independent
              appeal for review. Please use the 'Appeals' menu to start the
              appeal process.
            </li>
            <li v-if="acceptValidation.msfaaInvalid">
              Your MSFAA is not valid. Please complete your MSFAA with the
              National Student Loans Centre to move forward with your
              application. Please note, there is a one day delay between signing
              your MSFAA and being able to accept your assessment.
            </li>
            <li v-if="acceptValidation.hasStopDisbursementRestriction">
              You have restrictions that block funding on your account. Please
              resolve them in order to move forward with your application.
            </li>
            <li
              v-if="acceptValidation.hasStopDisbursementInstitutionRestriction"
            >
              Your application is currently pending further review by StudentAid
              BC.
            </li>
            <li v-if="acceptValidation.noEstimatedAwardAmounts">
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
            <!-- Institution restrictions. -->
            <li
              v-for="restriction in acceptValidation.institutionRestrictionMessages"
              :key="restriction"
            >
              {{ restriction }}
            </li>
          </ul>
        </template>
      </banner>
    </template>
    <notice-of-assessment-form-view
      :assessment-id="assessmentId"
      @assessment-data-loaded="assessmentDataLoaded"
    />
    <footer-buttons
      justify="end"
      primary-label="Accept assessment"
      :show-primary-button="assessmentId === currentAssessmentId"
      :disable-primary-button="!canAcceptAssessment"
      @primary-click="confirmAssessment"
      secondary-label="Cancel application"
      :show-secondary-button="true"
      @secondary-click="confirmCancelApplication"
      secondary-button-color="danger"
      secondary-button-variant="elevated"
      v-if="!viewOnly"
      class="mr-1"
    />
    <cancel-application ref="cancelApplicationModal" />
  </student-page-container>
</template>

<script lang="ts">
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import {
  AcceptAssessmentRestrictionAPIOutDTO,
  AssessmentNOAAPIOutDTO,
} from "@/services/http/dto";
import { computed, defineComponent, onMounted, ref } from "vue";
import {
  ApplicationStatus,
  AssessmentStatus,
  ClientIdType,
  BannerTypes,
  ECertFailedValidation,
  ApiProcessError,
} from "@/types";
import CancelApplication from "@/components/students/modals/CancelApplication.vue";
import { useRouter } from "vue-router";
import { ASSESSMENT_CANNOT_BE_ACCEPTED_DUE_TO_INSTITUTION_RESTRICTION } from "@/constants";

const INSTITUTION_RESTRICTED_DEFAULT_MESSAGE =
  "Your assessment cannot be accepted at this time because your institution is currently restricted.";

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
    const acceptValidation = ref({
      disabilityStatusNotConfirmed: false,
      modifiedIndependentStatusNotApproved: false,
      msfaaInvalid: false,
      hasStopDisbursementRestriction: false,
      hasStopDisbursementInstitutionRestriction: false,
      noEstimatedAwardAmounts: false,
      hasEffectiveAviationRestriction: false,
      institutionRestrictionMessages: [] as string[],
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
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType ===
            ASSESSMENT_CANNOT_BE_ACCEPTED_DUE_TO_INSTITUTION_RESTRICTION
        ) {
          snackBar.error(INSTITUTION_RESTRICTED_DEFAULT_MESSAGE);
          return;
        }
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

    /**
     * Get unique institution restriction messages to be displayed to the student.
     * If a restriction does not have a message, a default message will be used instead.
     * @param restrictions List of institution restrictions to be evaluated.
     * @returns list of unique messages to be displayed to the student.
     */
    const getInstitutionRestrictionMessages = (
      restrictions: AcceptAssessmentRestrictionAPIOutDTO[],
    ) => {
      const messages = restrictions.map(
        (restriction) =>
          restriction.message || INSTITUTION_RESTRICTED_DEFAULT_MESSAGE,
      );
      return [...new Set(messages)];
    };

    onMounted(async () => {
      const warnings =
        await StudentAssessmentsService.shared.getApplicationWarnings(
          props.applicationId,
        );
      canAcceptAssessment.value = warnings.canAcceptAssessment;
      acceptValidation.value = {
        disabilityStatusNotConfirmed: warnings.eCertFailedValidations.includes(
          ECertFailedValidation.DisabilityStatusNotConfirmed,
        ),
        modifiedIndependentStatusNotApproved:
          warnings.eCertFailedValidations.includes(
            ECertFailedValidation.ModifiedIndependentStatusNotApproved,
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
        hasStopDisbursementInstitutionRestriction:
          warnings.eCertFailedValidations.includes(
            ECertFailedValidation.HasStopDisbursementInstitutionRestriction,
          ),
        noEstimatedAwardAmounts: warnings.eCertFailedValidations.includes(
          ECertFailedValidation.NoEstimatedAwardAmounts,
        ),
        hasEffectiveAviationRestriction:
          warnings.eCertFailedValidationsInfo
            ?.hasEffectiveAviationRestriction ?? false,
        institutionRestrictionMessages: getInstitutionRestrictionMessages(
          warnings.acceptAssessmentRestrictions,
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
      acceptValidation,
      canAcceptAssessment,
      showAcceptAssessmentWarnings,
      INSTITUTION_RESTRICTED_DEFAULT_MESSAGE,
    };
  },
});
</script>
