<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <body-header-container>
    <template #header>
      <body-header title="Complete all question(s) below">
        <template #subtitle>
          All requested changes will be reviewed by StudentAid BC after you
          submit for review.
          <slot name="submit-appeal-header">
            <div class="mt-4">
              <p class="font-bold">Instructions:</p>
              <ul>
                <li>
                  Select any applicable appeal forms for your application.
                </li>
                <li>
                  Previously approved appeals attached to this application must
                  be re-entered here.
                </li>
                <li>All appeal form questions are mandatory.</li>
              </ul>
            </div>
          </slot>
        </template>
      </body-header>
    </template>
    <appeal-requests-form
      :student-appeal-requests="appealRequestsForms"
      @submitted="submitAppeal"
    >
      <template #actions="{ submit }">
        <footer-buttons
          justify="space-between"
          :processing="processing"
          @secondary-click="$.emit('cancel')"
          secondary-label="Back"
          @primary-click="submit"
          primary-label="Submit for review"
        ></footer-buttons>
      </template>
    </appeal-requests-form>
  </body-header-container>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from "vue";
import { ApiProcessError, StudentAppealRequest } from "@/types";
import { StudentAppealService } from "@/services/StudentAppealService";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";
import { useSnackBar } from "@/composables";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "@/constants";

export default defineComponent({
  emits: {
    cancel: null,
    submitted: null,
  },
  components: {
    AppealRequestsForm,
  },
  props: {
    appealForms: {
      type: Array as PropType<string[]>,
      required: true,
    },
    applicationId: {
      type: Number,
      default: null,
      required: false,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const processing = ref(false);
    const appealRequestsForms = ref(
      props.appealForms.map(
        (formName) => ({ formName }) as StudentAppealRequest,
      ),
    );

    const submitAppeal = async (appealRequests: StudentAppealRequest[]) => {
      try {
        processing.value = true;
        await StudentAppealService.shared.submitStudentAppeal(
          props.applicationId,
          appealRequests,
        );
        snackBar.success(
          `The request for change has been submitted successfully.`,
        );
        emit("submitted");
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
          "An unexpected error happened while submitting the request for change.",
        );
      } finally {
        processing.value = false;
      }
    };

    return {
      appealRequestsForms,
      submitAppeal,
      processing,
    };
  },
});
</script>
