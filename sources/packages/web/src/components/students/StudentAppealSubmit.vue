<template>
  <template v-if="showRequestForAppeal">
    <!-- Select appeal area -->
    <slot name="select-appeal-header"></slot>
    <formio-container
      :formName="isChangeRequest ? 'studentRequestChange' : 'studentAppeals'"
      :formData="initialData"
      @submitted="submitRequest"
    >
      <template #actions="{ submit }">
        <footer-buttons
          justify="end"
          :show-secondary-button="false"
          @primaryClick="submit"
          primaryLabel="Next"
        ></footer-buttons>
      </template>
    </formio-container>
  </template>
  <template v-else>
    <!-- Submit appeal area -->
    <slot name="submit-appeal-header"></slot>
    <appeal-requests-form
      :student-appeal-requests="appealRequestsForms"
      @submitted="submitAppeal"
    >
      <template #actions="{ submit }">
        <footer-buttons
          justify="space-between"
          :processing="processing"
          @secondaryClick="backToRequestForm"
          secondaryLabel="Back"
          @primaryClick="submit"
          primaryLabel="Submit for review"
        ></footer-buttons>
      </template>
    </appeal-requests-form>
  </template>
</template>
<script lang="ts">
import { computed, ref, defineComponent, onMounted } from "vue";
import { ApiProcessError, FormIOForm, StudentAppealRequest } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentAppealService } from "@/services/StudentAppealService";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";
import { useSnackBar } from "@/composables";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "@/constants";
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
    AppealRequestsForm,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    isChangeRequest: {
      type: Boolean,
      required: false,
      // This prop is used to determine if the operation is for a change request or an appeal.
      default: false,
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
    const operation = props.isChangeRequest ? "request for change" : "appeal";

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
      } catch {
        snackBar.error(
          `An unexpected error happened while retrieving the application to submit the ${operation}.`,
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
        snackBar.success(`The ${operation} has been submitted successfully.`);
        backToRequestForm();
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case APPLICATION_CHANGE_NOT_ELIGIBLE:
              snackBar.warn(`Not able to submit. ${error.message}`);
              break;
            default:
              snackBar.error(error.message);
              break;
          }
          return;
        }
        snackBar.error(
          `An unexpected error happened while submitting the ${operation}.`,
        );
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
