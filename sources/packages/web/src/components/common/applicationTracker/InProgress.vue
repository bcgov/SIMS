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
    v-if="applicationDetails?.pirStatus === ProgramInfoStatus.required"
    ><template #content
      >We sent a <strong>program information request</strong> to your
      institution to complete the study information in your application. Please
      contact your Financial Aid Officer from your institution, if you require
      more information.</template
    ></application-status-tracker-banner
  >

  <template
    v-for="(parent, index) in applicationDetails?.parentsInfo"
    :key="index"
  >
    <application-status-tracker-banner
      v-if="
        parent.status === SuccessWaitingStatus.Waiting && parent.isAbleToReport
      "
      :label="`Waiting for additional information from ${parent.parentFullName}`"
      icon="fa:fas fa-clock"
      icon-color="secondary"
    >
      <template #content>
        We are waiting for supporting information from
        <strong>{{ parent.parentFullName }}</strong
        >. Please check your email from StudentAidBC for further instructions.
        The email includes important details and a secure link that your parent
        will need in order to provide their information for your application.
      </template>
    </application-status-tracker-banner>

    <application-status-tracker-banner
      v-if="
        parent.status === SuccessWaitingStatus.Waiting && !parent.isAbleToReport
      "
      :label="`Parent information required for ${parent.parentFullName}`"
      icon="fa:fas fa-exclamation-triangle"
      icon-color="warning"
      background-color="warning-bg"
    >
      <template #content>
        You have indicated that <strong>{{ parent.parentFullName }}</strong> is
        unable to complete their declaration. Please complete the following
        declaration on their behalf. Click on the button below to complete the
        declaration.
      </template>
      <template #actions>
        <v-btn
          color="primary"
          @click="navigateToParentReporting(parent.supportingUserId)"
        >
          Student Declare
        </v-btn>
      </template>
    </application-status-tracker-banner>
  </template>

  <application-status-tracker-banner
    label="Waiting for additional information from your partner"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    v-if="applicationDetails?.partnerInfo === SuccessWaitingStatus.Waiting"
    ><template #content
      >We are waiting for
      <strong>supporting information from your partner.</strong> Please check
      your email to confirm that you have received a message from us. This email
      will include important details and links that your partner will need in
      order to provide their information for your application.</template
    ></application-status-tracker-banner
  >

  <application-status-tracker-banner
    label="Waiting for your parent's income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your parent's income."
    v-if="
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
      applicationDetails?.studentIncomeVerificationStatus ===
      SuccessWaitingStatus.Success
    "
  />

  <template
    v-for="(parent, index) in applicationDetails?.parentsInfo"
    :key="index"
  >
    <application-status-tracker-banner
      v-if="parent.status === SuccessWaitingStatus.Success"
      label="Parent information request completed"
      icon="fa:fas fa-check-circle"
      icon-color="success"
      :content="`We have successfully received supporting information from ${parent.parentFullName}.`"
    />
  </template>

  <application-status-tracker-banner
    label="Partner information request completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="We have successfully received supporting information from your partner."
    v-if="applicationDetails?.partnerInfo === SuccessWaitingStatus.Success"
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
import { onMounted, ref, defineComponent } from "vue";
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
  },
  setup(props) {
    const applicationDetails = ref<InProgressApplicationDetailsAPIOutDTO>();
    const router = useRouter();

    const navigateToParentReporting = (supportingUserId: number) => {
      router.push({
        name: StudentRoutesConst.REPORT_PARENT_INFORMATION,
        params: {
          applicationId: String(props.applicationId),
          supportingUserId: String(supportingUserId),
        },
      });
    };

    onMounted(async () => {
      applicationDetails.value =
        await ApplicationService.shared.getInProgressApplicationDetails(
          props.applicationId,
        );
    });

    return {
      navigateToParentReporting,
      ProgramInfoStatus,
      applicationDetails,
      ApplicationExceptionStatus,
      OfferingStatus,
      SuccessWaitingStatus,
    };
  },
});
</script>
