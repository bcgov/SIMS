<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Applications"
        sub-title="Appeals"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        }"
      />
    </template>
    <student-appeal-shared-form :application-id="applicationId" />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealSharedForm from "@/components/students/StudentAppealSharedForm.vue";

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
    return { StudentRoutesConst };
  },
});
</script>
