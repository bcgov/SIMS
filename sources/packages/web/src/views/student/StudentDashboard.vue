<template>
  <student-page-container layout-template="centered">
    <template #alerts>
      <announcement-banner dashboard="student-dashboard"
    /></template>
    <formio-container
      form-name="studentWelcomePage"
      :form-data="welcomeFormData"
      @custom-event="goToStudentApplication"
    />
  </student-page-container>
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useStudentStore } from "@/composables";
import AnnouncementBanner from "@/components/common/AnnouncementBanner.vue";

export default defineComponent({
  components: { AnnouncementBanner },
  setup() {
    const { studentDetails, hasValidSIN } = useStudentStore();
    const router = useRouter();

    const welcomeFormData = computed(() => {
      return {
        ...studentDetails.value,
        hasValidSIN: hasValidSIN.value,
      };
    });

    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    return {
      StudentRoutesConst,
      goToStudentApplication,
      welcomeFormData,
    };
  },
});
</script>
