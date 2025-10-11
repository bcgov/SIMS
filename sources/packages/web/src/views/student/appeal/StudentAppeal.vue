<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" sub-title="Appeals" />
    </template>
    <student-appeal-shared-form />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import StudentAppealSharedForm from "@/components/students/StudentAppealSharedForm.vue";

export default defineComponent({
  components: {
    StudentAppealSharedForm,
  },
});
</script>
