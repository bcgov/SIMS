<template>
  <student-page-container :layout-template="LayoutTemplates.CenteredCardTab">
    <template #header>
      <header-navigator title="Student" sub-title="Appeals" />
    </template>
    <template #tab-header>
      <student-appeal-shared-form />
    </template>
    <router-view />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import StudentAppealSharedForm from "@/components/students/StudentAppealSharedForm.vue";
import { LayoutTemplates } from "@/types";

export default defineComponent({
  components: {
    StudentAppealSharedForm,
  },
  setup() {
    return { LayoutTemplates };
  },
});
</script>
