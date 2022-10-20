<template>
  <student-page-container layout-template="centered">
    <formio-container
      formName="studentWelcomePage"
      :formData="studentDetails"
      @customEvent="goToStudentApplication"
    />
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useStudentStore } from "@/composables";

export default {
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
};
</script>
