<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator title="Student" subTitle="Request a Change" />
    </template>
    <div v-if="showRequestForAppeal">
      <!-- Content area. -->
      <formio-container
        formName="studentRequestChange"
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
      <body-header
        title="Complete all question(s) below"
        subTitle="All requested changes will be reviewed by StudentAid BC after you submit for review."
      >
      </body-header>
      <br />
      <p><b>Instructions:</b></p>
      <ul>
        <li>You must complete all fields of the change request form.</li>
        <li>
          All information that has not changed should match what was entered on
          your application.
        </li>
        <li>
          Information from previously approved Change Requests attached to this
          application must be re-entered here.
        </li>
      </ul>
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
  </student-page-container>
</template>
<script lang="ts">
import { computed, ref, defineComponent, onMounted } from "vue";
import { ApiProcessError, FormIOForm, StudentAppealRequest } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentAppealService } from "@/services/StudentAppealService";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";
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
    AppealRequestsForm,
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
