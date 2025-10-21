<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" sub-title="Submit Appeal(s)" />
    </template>
    <student-appeal-submit-shared-form
      :appeal-forms="appealForms"
      :processing="processing"
      @cancel="goToStudentAppeals"
      @submitted="submitted"
    />
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealSubmitSharedForm from "@/components/students/StudentAppealSubmitSharedForm.vue";
import { useRouter } from "vue-router";
import { StudentAppealService } from "@/services/StudentAppealService";
import { StudentAppealRequest, ApiProcessError } from "@/types";
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
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const processing = ref(false);

    const goToStudentAppeals = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPEAL,
      });
    };

    const submitted = async (appealRequests: StudentAppealRequest[]) => {
      try {
        processing.value = true;
        const [studentAppeal] = appealRequests;
        await StudentAppealService.shared.submitStudentAppeal(studentAppeal);
        snackBar.success("The student appeal has been submitted successfully.");
        goToStudentAppeals();
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
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
      goToStudentAppeals,
      submitted,
      processing,
    };
  },
});
</script>
