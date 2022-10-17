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
import { onMounted, ref, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { StudentFormInfo } from "@/types";

export default defineComponent({
  setup() {
    const router = useRouter();
    const formData = ref<StudentFormInfo>();
    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    onMounted(async () => {
      formData.value = await StudentService.shared.getStudentProfile();
    });

    return {
      StudentRoutesConst,
      goToStudentApplication,
      formData,
    };
  },
});
</script>
