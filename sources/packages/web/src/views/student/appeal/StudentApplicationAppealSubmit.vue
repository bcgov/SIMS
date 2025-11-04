<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application Appeal"
        sub-title="Submit Appeal(s)"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL_SUBMISSION,
          params: { applicationId },
        }"
      />
    </template>
    <student-appeal-submit-shared-form
      :appeal-forms="appealForms"
      :application-id="applicationId"
      :processing="processing"
      @cancel="canceledSubmission"
      @submitted="submitted"
    >
      <template #submit-appeal-header>
        <div class="mt-4">
          <p class="font-bold">Instructions:</p>
          <ul>
            <li>Select any applicable appeal forms for your application.</li>
            <li>
              Previously approved appeals attached to this application must be
              re-entered here.
            </li>
            <li>All appeal form questions are mandatory.</li>
          </ul>
        </div>
      </template>
    </student-appeal-submit-shared-form>
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealSubmitSharedForm from "@/components/students/StudentAppealSubmitSharedForm.vue";
import { useRouter } from "vue-router";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "@/constants";
import { StudentAppealService } from "@/services/StudentAppealService";
import { ApiProcessError, StudentAppealRequest } from "@/types";
import { useSnackBar } from "@/composables";

export default defineComponent({
  components: {
    StudentAppealSubmitSharedForm,
  },
  props: {
    appealForms: {
      type: Array as PropType<string[]>,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const processing = ref(false);

    const canceledSubmission = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL_SUBMISSION,
        params: {
          applicationId: props.applicationId,
        },
      });
    };

    const submitted = async (appealRequests: StudentAppealRequest[]) => {
      try {
        processing.value = true;
        await StudentAppealService.shared.submitApplicationAppeal(
          props.applicationId,
          appealRequests,
        );
        snackBar.success(
          "The application appeal has been submitted successfully.",
        );
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: props.applicationId,
          },
        });
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (error.errorType === APPLICATION_CHANGE_NOT_ELIGIBLE) {
            snackBar.warn(error.message);
          } else {
            snackBar.error(error.message);
          }
          return;
        }
        snackBar.error(
          "An unexpected error happened while submitting the appeal.",
        );
      } finally {
        processing.value = false;
      }
    };

    return {
      StudentRoutesConst,
      canceledSubmission,
      submitted,
      processing,
    };
  },
});
</script>
