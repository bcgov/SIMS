<template>
  <student-page-container layout-template="centered"
    >{{ formData }}
    <!-- todo: student namr ann first name is full name verify and check api -->
    <formio-container
      formName="studentWelcomePage"
      :formData="formData"
      @customEvent="goToStudentApplication"
    ></formio-container>
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { onMounted, reactive } from "vue";
import { StudentService } from "@/services/StudentService";

export default {
  setup() {
    const router = useRouter();
    const formData = reactive({ firstName: "" });
    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    onMounted(async () => {
      const studentDetail = await StudentService.shared.getStudentProfile();
      formData.firstName = studentDetail.firstName;
    });

    return {
      StudentRoutesConst,
      goToStudentApplication,
      formData,
    };
  },
};
</script>
