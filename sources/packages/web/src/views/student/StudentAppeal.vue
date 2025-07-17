<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator title="Student" subTitle="Submit Appeal" />
    </template>
    <student-appeal-submit
      :application-id="applicationId"
      appeals-form-name="studentAppeals"
      ><template #select-appeal-header>
        <body-header
          title="When to request a change"
          subTitle="After your school has confirmed your enrolment, you must inform StudentAid BC of any changes to the information you provided in your application."
        >
        </body-header>
        <student-appeal-instructions />
      </template>
      <template #submit-appeal-header>
        <body-header
          title="Complete all question(s) below"
          subTitle="All requested changes will be reviewed by StudentAid BC after you submit for review."
        >
        </body-header>
        <student-appeal-instructions /> </template
    ></student-appeal-submit>
  </student-page-container>
</template>
<script lang="ts">
import { computed, ref, defineComponent, onMounted } from "vue";
import { ApiProcessError, FormIOForm, StudentAppealRequest } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentAppealService } from "@/services/StudentAppealService";
import StudentAppealSubmit from "@/components/students/StudentAppealSubmit.vue";
import StudentAppealInstructions from "@/components/students/StudentAppealInstructions.vue";
import { useSnackBar } from "@/composables";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_HAS_PENDING_APPEAL,
} from "@/constants";
import { ApplicationProgramYearAPIOutDTO } from "@/services/http/dto";

/**
 * Model for student request change form.
 */
interface StudentRequestSelectedForms {
  applicationNumber: string;
  formNames: string[];
}

export default defineComponent({
  components: {
    StudentAppealSubmit,
    StudentAppealInstructions,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const processing = ref(false);
    const appealRequestsForms = ref([] as StudentAppealRequest[]);
    const initialData = ref({} as StudentRequestSelectedForms);
    let applicationAppealData: ApplicationProgramYearAPIOutDTO;
    const showRequestForAppeal = computed(
      () => appealRequestsForms.value.length === 0,
    );

    onMounted(async () => {
      try {
        applicationAppealData =
          await ApplicationService.shared.getApplicationForRequestChange(
            props.applicationId,
          );
        initialData.value = {
          applicationNumber: applicationAppealData.applicationNumber,
          formNames: [],
        };
      } catch (error: unknown) {
        snackBar.error(
          "An unexpected error happened while retrieving the application to request a change.",
        );
      }
    });

    const submitRequest = async (
      form: FormIOForm<StudentRequestSelectedForms>,
    ) => {
      appealRequestsForms.value = form.data.formNames.map(
        (formName) =>
          ({
            formName,
            data: { programYear: applicationAppealData.programYear },
          } as StudentAppealRequest),
      );
    };

    const backToRequestForm = () => {
      appealRequestsForms.value = [];
    };

    const submitAppeal = async (appealRequests: StudentAppealRequest[]) => {
      try {
        processing.value = true;
        await StudentAppealService.shared.submitStudentAppeal(
          props.applicationId,
          appealRequests,
        );
        snackBar.success(
          "The request for change has been submitted successfully.",
        );
        backToRequestForm();
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case APPLICATION_CHANGE_NOT_ELIGIBLE:
              snackBar.warn(`Not able to submit. ${error.message}`);
              break;
            case APPLICATION_HAS_PENDING_APPEAL:
              snackBar.error(`${error.message}`);
              break;
          }
        }
      } finally {
        processing.value = false;
      }
    };

    return {
      initialData,
      submitRequest,
      appealRequestsForms,
      showRequestForAppeal,
      backToRequestForm,
      submitAppeal,
      processing,
    };
  },
});
</script>
