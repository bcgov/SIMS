<template>
  <student-page-container layout-template="centered">
    <template #alerts>
      <announcement-banner dashboard="StudentDashboard"
    /></template>
    <formio-container
      formName="studentWelcomePage"
      :formData="studentDetails"
      @customEvent="goToStudentApplication"
    />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useStudentStore } from "@/composables";
import AnnouncementBanner from "@/components/common/AnnouncementBanner.vue";

export default defineComponent({
  components: { AnnouncementBanner },
  setup() {
    const { studentDetails } = useStudentStore();
    const router = useRouter();

    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    return {
      StudentRoutesConst,
      goToStudentApplication,
      studentDetails,
    };
  },
});
</script>
