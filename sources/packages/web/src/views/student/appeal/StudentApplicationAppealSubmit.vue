<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application Appeal"
        sub-title="Appeal(s) Request"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL,
          params: { applicationId },
        }"
      />
    </template>
    <student-appeal-submit-shared-form
      :appeal-forms="appealForms"
      :application-id="applicationId"
      @cancel="canceledSubmission"
      @submitted="submitted"
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
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();

    const canceledSubmission = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL,
        params: {
          applicationId: props.applicationId,
        },
      });
    };

    const submitted = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
        params: {
          applicationId: props.applicationId,
        },
      });
    };

    return {
      StudentRoutesConst,
      canceledSubmission,
      submitted,
    };
  },
});
</script>
