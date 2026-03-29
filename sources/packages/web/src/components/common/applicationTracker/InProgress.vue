<template>
  <!-- Denial cards. -->
  <application-status-tracker-banner
    v-if="applicationDetails?.pirStatus === ProgramInfoStatus.declined"
    label="Your institution denied your program information request"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    ><template #content
      ><strong>Reason from your institution:</strong>
      {{ applicationDetails.pirDeniedReason }}. Please contact the Financial Aid
      Officer from your institution for more information. You will need to edit
      your application for it to be processed again.</template
    ></application-status-tracker-banner
  >
  <application-status-tracker-banner
    v-if="
      applicationDetails?.exceptionStatus ===
      ApplicationExceptionStatus.Declined
    "
    label="StudentAid BC has not accepted your application"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    content="StudentAid BC has not accepted 1 or more of the additional information that you provided in your 
    application, making it ineligible for funding. Please contact StudentAid BC if your require more details. 
    You may edit your application with new additional information to process it again or cancel your application."
    background-color="error-bg"
  />

  <!-- Waiting cards. -->
  <application-status-tracker-banner
    label="Waiting for your income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your income."
    v-if="
      applicationDetails?.studentIncomeVerificationStatus ===
      SuccessWaitingStatus.Waiting
    "
  />

  <application-status-tracker-banner
    label="Waiting for additional information from your institution"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    v-if="
      showStudentBanners &&
      applicationDetails?.pirStatus === ProgramInfoStatus.required
    "
    ><template #content
      >We sent a <strong>program information request</strong> to your
      institution to complete the study information in your application. Please
      contact your Financial Aid Officer from your institution, if you require
      more information.</template
    ></application-status-tracker-banner
  >

  <!-- Parent information banners are only visible in the student view. -->
  <template v-if="showStudentBanners">
    <template
      v-for="parent in applicationDetails?.parentsInfo"
      :key="parent.supportingUserId"
    >
      <application-status-tracker-banner
        v-if="
          parent.status === SuccessWaitingStatus.Waiting &&
          parent.isAbleToReport
        "
        :label="`Waiting for additional information from ${parent.fullName}`"
        icon="fa:fas fa-clock"
        icon-color="secondary"
      >
        <template #content>
          We are waiting for supporting information from
          <strong>{{ parent.fullName }}</strong
          >. Please check your email from StudentAidBC for further instructions.
          The email includes important details and a secure link that your
          parent will need in order to provide their information for your
          application.
        </template>
      </application-status-tracker-banner>

      <application-status-tracker-banner
        v-if="
          parent.status === SuccessWaitingStatus.Waiting &&
          !parent.isAbleToReport
        "
        :label="`Parent information required for ${parent.fullName}`"
        icon="fa:fas fa-exclamation-triangle"
        icon-color="warning"
        background-color="warning-bg"
      >
        <template #content>
          You have indicated that <strong>{{ parent.fullName }}</strong> is
          unable to complete their declaration. Please complete the following
          declaration on their behalf. Click on the button below to complete the
          declaration.
        </template>
        <template #actions>
          <v-btn
            color="primary"
            @click="navigateToParentReporting(parent.supportingUserId)"
            :disabled="!areApplicationActionsAllowed"
          >
            {{ parent.fullName }}
          </v-btn>
        </template>
      </application-status-tracker-banner>
    </template>
  </template>

  <application-status-tracker-banner
    :label="`Waiting for additional information from ${partnerName}`"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    v-if="
      showStudentBanners &&
      applicationDetails?.partnerInfo?.status ===
        SuccessWaitingStatus.Waiting &&
      applicationDetails.partnerInfo.isAbleToReport
    "
    ><template #content
      >We are waiting for supporting information from
      <strong>{{ partnerName }}</strong
      >. Please check your email from StudentAidBC for further instructions. The
      email includes important details and a secure link that your
      spouse/common-law partner will need in order to provide their information
      for your application.</template
    ></application-status-tracker-banner
  >

  <application-status-tracker-banner
    :label="`Spouse/common-law partner information required for ${applicationDetails?.partnerInfo.fullName}`"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    v-if="
      showStudentBanners &&
      applicationDetails?.partnerInfo?.status ===
        SuccessWaitingStatus.Waiting &&
      !applicationDetails.partnerInfo?.isAbleToReport
    "
    ><template #content
      >You have indicated that
      <strong>{{ applicationDetails.partnerInfo.fullName }}</strong> is unable
      to complete their declaration. Please complete the following declaration
      on their behalf. Click on the button below to complete the
      declaration.</template
    >
    <template #actions>
      <v-btn
        color="primary"
        @click="
          navigateToPartnerReporting(
            applicationDetails.partnerInfo.supportingUserId,
          )
        "
        :disabled="!areApplicationActionsAllowed"
      >
        {{ applicationDetails.partnerInfo.fullName }}
      </v-btn>
    </template></application-status-tracker-banner
  >

  <application-status-tracker-banner
    label="Waiting for your parent's income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your parent's income."
    v-if="
      showStudentBanners &&
      applicationDetails?.parent1IncomeVerificationStatus ===
        SuccessWaitingStatus.Waiting
    "
  />

  <application-status-tracker-banner
    label="Waiting for your other parent's income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your other parent's income."
    v-if="
      showStudentBanners &&
      applicationDetails?.parent2IncomeVerificationStatus ===
        SuccessWaitingStatus.Waiting
    "
  />

  <application-status-tracker-banner
    label="Waiting for your partner's income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your income."
    v-if="
      showStudentBanners &&
      applicationDetails?.partnerIncomeVerificationStatus ===
        SuccessWaitingStatus.Waiting
    "
  />

  <application-status-tracker-banner
    label="Waiting for StudentAid BC to review your application"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="StudentAid BC is currently reviewing your application and the 
    additional information you provided for 1 or more of the questions."
    v-if="
      showStudentBanners &&
      applicationDetails?.exceptionStatus === ApplicationExceptionStatus.Pending
    "
  />

  <application-status-tracker-banner
    label="Waiting for other applications in the program year"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="There are other applications for this program year that may affect your
      assessment. Once any earlier applications have been assessed this
      application will move to the assessment stage."
    v-if="
      showStudentBanners &&
      applicationDetails?.outstandingAssessmentStatus ===
        SuccessWaitingStatus.Waiting
    "
  />

  <!-- Success cards. -->
  <application-status-tracker-banner
    label="Income verification completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="The Canada Revenue Agency (CRA) has successfully verified your income."
    v-if="
      showStudentBanners &&
      applicationDetails?.studentIncomeVerificationStatus ===
        SuccessWaitingStatus.Success
    "
  />

  <!-- Parent information banners are only visible in the student view. -->
  <template v-if="showStudentBanners">
    <template
      v-for="parent in applicationDetails?.parentsInfo"
      :key="parent.supportingUserId"
    >
      <application-status-tracker-banner
        v-if="parent.status === SuccessWaitingStatus.Success"
        label="Parent information request completed"
        icon="fa:fas fa-check-circle"
        icon-color="success"
        :content="`We have successfully received supporting information from ${parent.fullName}.`"
      />
    </template>
  </template>

  <application-status-tracker-banner
    label="Partner information request completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="We have successfully received supporting information from your partner."
    v-if="
      showStudentBanners &&
      applicationDetails?.partnerInfo?.status === SuccessWaitingStatus.Success
    "
  />

  <application-status-tracker-banner
    v-if="applicationDetails?.pirStatus === ProgramInfoStatus.completed"
    label="Institution program information request completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="We have successfully received confirmed program and study information from your institution."
  />

  <application-status-tracker-banner
    label="Parent income verification completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="The Canada Revenue Agency (CRA) has successfully verified your parent's income."
    v-if="
      showStudentBanners &&
      applicationDetails?.parent1IncomeVerificationStatus ===
        SuccessWaitingStatus.Success
    "
  />

  <application-status-tracker-banner
    label="Parent income verification completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="The Canada Revenue Agency (CRA) has successfully verified your other parent's income."
    v-if="
      showStudentBanners &&
      applicationDetails?.parent2IncomeVerificationStatus ===
        SuccessWaitingStatus.Success
    "
  />

  <application-status-tracker-banner
    label="Partner income verification completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="The Canada Revenue Agency (CRA) has successfully verified your partner's income."
    v-if="
      showStudentBanners &&
      applicationDetails?.partnerIncomeVerificationStatus ===
        SuccessWaitingStatus.Success
    "
  />

  <application-status-tracker-banner
    label="StudentAid BC application review completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="StudentAid BC has successfully reviewed and accepted the additional information you provided."
    v-if="
      showStudentBanners &&
      applicationDetails?.exceptionStatus ===
        ApplicationExceptionStatus.Approved
    "
  />
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/common/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import {
  ApplicationExceptionStatus,
  OfferingStatus,
  ProgramInfoStatus,
  SuccessWaitingStatus,
} from "@/types";
import { onMounted, ref, defineComponent, computed } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { InProgressApplicationDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    areApplicationActionsAllowed: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * When false, hides student-specific banners (parent/partner declarations,
     * income verifications, Ministry waiting states). Used for institution users
     * who should only see PIR-related and exception status information.
     */
    showStudentBanners: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const applicationDetails = ref<InProgressApplicationDetailsAPIOutDTO>();
    const router = useRouter();

    const navigateToParentReporting = (supportingUserId: number) => {
      router.push({
        name: StudentRoutesConst.REPORT_PARENT_INFORMATION,
        params: {
          applicationId: props.applicationId,
          supportingUserId: supportingUserId,
        },
      });
    };

    const navigateToPartnerReporting = (supportingUserId: number) => {
      router.push({
        name: StudentRoutesConst.REPORT_PARTNER_INFORMATION,
        params: {
          applicationId: props.applicationId,
          supportingUserId: supportingUserId,
        },
      });
    };

    const partnerName = computed(() => {
      return (
        applicationDetails.value?.partnerInfo?.fullName ??
        "your spouse/common-law partner"
      );
    });

    onMounted(async () => {
      applicationDetails.value =
        await ApplicationService.shared.getInProgressApplicationDetails(
          props.applicationId,
        );
    });

    return {
      navigateToParentReporting,
      navigateToPartnerReporting,
      partnerName,
      ProgramInfoStatus,
      applicationDetails,
      ApplicationExceptionStatus,
      OfferingStatus,
      SuccessWaitingStatus,
    };
  },
});
</script>
