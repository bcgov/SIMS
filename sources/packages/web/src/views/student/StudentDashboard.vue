<template>
  <student-page-container layout-template="centered">
    <formio-container
      formName="studentWelcomePage"
      :formData="formData"
      @customEvent="goToStudentApplication"
    />
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useStudentStore } from "@/composables";
import { ref } from "vue";

export default {
  setup() {
    const { firstName } = useStudentStore();
    const router = useRouter();
    const formData = ref({ firstName: firstName });

    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    return {
      StudentRoutesConst,
      goToStudentApplication,
      formData,
      firstName,
    };
  },
};
</script>
