<template>
  <student-page-container :layout-template="LayoutTemplates.CenteredCardTab">
    <template #header>
      <header-navigator
        title="Applications"
        sub-title="Appeals"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        }"
      />
    </template>
    <template #tab-header>
      <student-appeal-shared-form :application-id="applicationId" />
    </template>
    <router-view />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealSharedForm from "@/components/students/StudentAppealSharedForm.vue";
import { LayoutTemplates } from "@/types";

export default defineComponent({
  components: {
    StudentAppealSharedForm,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return { StudentRoutesConst, LayoutTemplates };
  },
});
</script>
