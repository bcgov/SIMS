<!-- Legacy appeals submission (a.k.a. "change request"). -->
<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator title="Student" sub-title="Request a Change" />
    </template>
    <template v-if="showRequestForAppeal">
      <!-- Select appeal area -->
      <slot name="select-appeal-header"></slot>
      <formio-container
        form-name="studentRequestChange"
        :form-data="initialData"
        :is-data-ready="isDataReady"
        @submitted="submitRequest"
      >
        <template #actions="{ submit }">
          <footer-buttons
            justify="end"
            :show-secondary-button="false"
            @primary-click="submit"
            primary-label="Next"
          ></footer-buttons>
        </template>
      </formio-container>
    </template>
    <template v-else>
      <!--Legacy appeals area -->
      <student-appeal-submit-shared-form
        :appeal-forms="appealRequestsForms"
        :application-id="applicationId"
        @cancel="canceledSubmission"
        @submitted="submitted"
      >
        <template #submit-appeal-header>
          <div class="mt-4">
            <p class="font-bold">Instructions:</p>
            <ul>
              <li>You must complete all fields of the change request form.</li>
              <li>
                All information that has not changed should match what was
                entered on your application.
              </li>
              <li>
                Information from previously approved Change Requests attached to
                this application must be re-entered here.
              </li>
            </ul>
          </div>
        </template>
      </student-appeal-submit-shared-form>
    </template>
  </student-page-container>
</template>

<script lang="ts">
import { computed, ref, defineComponent, watchEffect } from "vue";
import { FormIOForm } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useSnackBar } from "@/composables";
import { ApplicationProgramYearAPIOutDTO } from "@/services/http/dto";
import StudentAppealSubmitSharedForm from "@/components/students/StudentAppealSubmitSharedForm.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";

/**
 * Model for student request change form.
 */
interface StudentRequestSelectedForms {
  applicationNumber: string;
  formNames: string[];
}

export default defineComponent({
  components: {
    StudentAppealSubmitSharedForm,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const processing = ref(false);
    const appealRequestsForms = ref<string[]>([]);
    const initialData = ref({} as StudentRequestSelectedForms);
    let applicationAppealData: ApplicationProgramYearAPIOutDTO;
    const showRequestForAppeal = computed(
      () => appealRequestsForms.value.length === 0,
    );
    const isDataReady = ref(false);

    watchEffect(async () => {
      if (props.applicationId) {
        try {
          applicationAppealData =
            await ApplicationService.shared.getApplicationForRequestChange(
              props.applicationId,
            );
          initialData.value = {
            applicationNumber: applicationAppealData.applicationNumber,
            formNames: [],
          };
          isDataReady.value = true;
        } catch {
          snackBar.error(
            "An unexpected error happened while retrieving the application to submit the request for change.",
          );
        }
      }
    });

    const submitRequest = async (
      form: FormIOForm<StudentRequestSelectedForms>,
    ) => {
      appealRequestsForms.value = form.data.formNames;
    };

    const canceledSubmission = () => {
      appealRequestsForms.value = [];
    };

    const submitted = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
      });
    };

    return {
      initialData,
      submitRequest,
      appealRequestsForms,
      showRequestForAppeal,
      processing,
      isDataReady,
      canceledSubmission,
      submitted,
    };
  },
});
</script>
