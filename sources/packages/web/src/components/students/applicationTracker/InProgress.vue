<template>
  <!-- todo: ann  REMOVE IF CONDITION FROM SEARCH BOX -->
  <!-- Waiting cards -->
  <application-status-tracker-banner
    label="Waiting for your income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your income."
  />

  <application-status-tracker-banner
    label="Waiting for additional information from your institution"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    ><template #content
      ><span
        >We sent a <b>program information request</b> to your institution to
        complete the study information in your application. Please contact your
        Financial Aid Officer from your institution, if you require more
        information.</span
      ></template
    ></application-status-tracker-banner
  >

  <application-status-tracker-banner
    label="Waiting for additional information from a parent"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    ><template #content
      ><span
        >We are waiting for <b>supporting information from a parent.</b> Please
        check your email to confirm that you have received a message from us.
        This email will include important details and links that your parent
        will need in order to provide their information for your
        application.</span
      ></template
    ></application-status-tracker-banner
  >

  <application-status-tracker-banner
    label="Waiting for additional information from another parent"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    ><template #content
      ><span
        >We are waiting for
        <b>supporting information from another parent.</b> Please check your
        email to confirm that you have received a message from us. This email
        will include important details and links that your parent will need in
        order to provide their information for your application.</span
      ></template
    ></application-status-tracker-banner
  >

  <application-status-tracker-banner
    label="Waiting for additional information from your partner"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    ><template #content
      ><span
        >We are waiting for
        <b>supporting information from your partner.</b> Please check your email
        to confirm that you have received a message from us. This email will
        include important details and links that your partner will need in order
        to provide their information for your application.</span
      ></template
    ></application-status-tracker-banner
  >

  <application-status-tracker-banner
    label="Waiting for your parent's income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your parent's income."
  />

  <application-status-tracker-banner
    label="Waiting for your partner's income verification"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="The Canada Revenue Agency (CRA) is verifying your income."
  />

  <!-- Success cards -->
  <application-status-tracker-banner
    label="Income verification completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="The Canada Revenue Agency (CRA) has successfully verified your income."
  />

  <application-status-tracker-banner
    label="Parent information request completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="We have successfully received supporting information from a parent."
  />

  <application-status-tracker-banner
    label="Parent information request completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="We have successfully received supporting information from your other parent."
  />

  <application-status-tracker-banner
    label="Parent information request completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="We have successfully received supporting information from your partner."
  />

  <application-status-tracker-banner
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
  />

  <application-status-tracker-banner
    label="Partner income verification completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="The Canada Revenue Agency (CRA) has successfully verified your partner's income."
  />

  <application-status-tracker-banner
    label="StudentAid BC application review completed"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="StudentAid BC has successfully reviewed and accepted the additional information you provided."
  />

  <!-- Denial cards -->

  <application-status-tracker-banner
    label="Your institution denied your program information request"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error_bg"
    ><template #content
      ><span
        ><b>Reason from your institution:</b>
        <!-- todo:ann reason -->
        [insert reason]. Please contact the Financial Aid Officer from your
        institution for more information. You will need to edit your application
        for it to be processed again.</span
      ></template
    ></application-status-tracker-banner
  >
  <application-status-tracker-banner
    label="Your institution updated the study period. Please re-submit your application with the updated study period."
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error_bg"
    ><template #content
      ><span
        >Your institution updated the study period information. Please
        <a href="" @click="goToStudentApplication" class="primary-color"
          >start a new application</a
        >, select the updated study period, and submit your application to have
        it processed again. Please contact the Financial Aid Officer from your
        institution if you require more information about the change in study
        period.</span
      ></template
    ></application-status-tracker-banner
  >
  <application-status-tracker-banner
    label="StudentAid BC has not accepted your application"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    content="StudentAid BC has not accepted 1 or more of the additional information that you provided in your application, making it ineligible for funding. Please contact StudentAid BC if your require more details. You may edit your application with new additional information to process it again or cancel your application."
    background-color="error_bg"
  />
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";

export default {
  components: {
    ApplicationStatusTrackerBanner,
  },
  setup() {
    const router = useRouter();
    const goToStudentApplication = async () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    return { goToStudentApplication };
  },
};
</script>
