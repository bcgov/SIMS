<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" sub-title="Appeal(s) Request" />
    </template>
    <student-appeal-submit-shared-form :appeal-forms="appealForms" />
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import StudentAppealSubmitSharedForm from "../../../components/students/StudentAppealSubmitSharedForm.vue";

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
});
</script>
