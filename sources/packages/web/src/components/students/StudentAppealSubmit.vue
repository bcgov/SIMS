<template>
  <div v-if="showRequestForAppeal">
    <!-- Select appeal area -->
    <slot name="select-appeal-header"></slot>
    <formio-container
      :formName="appealsFormName"
      :formData="initialData"
      @submitted="submitRequest"
    >
      <template #actions="{ submit }">
        <v-btn @click="submit" color="primary" class="float-right">
          Next
        </v-btn>
      </template>
    </formio-container>
  </div>
  <div v-else>
    <!-- Submit appeal area -->
    <slot name="submit-appeal-header"></slot>
    <appeal-requests-form
      :student-appeal-requests="appealRequestsForms"
      @submitted="submitAppeal"
    >
      <template #actions="{ submit }">
        <v-btn
          color="primary"
          variant="outlined"
          class="mr-2"
          @click="backToRequestForm"
          >Back
        </v-btn>

        <v-btn
          color="primary"
          class="ml-2 float-right"
          @click="submit"
          :loading="processing"
          >Submit for review</v-btn
        >
      </template>
    </appeal-requests-form>
  </div>
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
    appealsFormName: {
      type: String,
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
      } catch (error: unknown) {
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
