<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" sub-title="Submit Appeal(s)" />
    </template>
    <student-appeal-submit-shared-form
      :appeal-forms="appealForms"
      @cancel="goToStudentAppeals"
      @submitted="goToStudentAppeals"
    />
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealSubmitSharedForm from "@/components/students/StudentAppealSubmitSharedForm.vue";
import { useRouter } from "vue-router";

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

    const goToStudentAppeals = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPEAL,
      });
    };

    return {
      goToStudentAppeals,
    };
  },
});
</script>
