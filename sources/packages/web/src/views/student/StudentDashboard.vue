<template>
  <student-page-container layout-template="centered">
    <formio
      formName="studentwelcomepage"
      @customEvent="goToStudentApplication"
    ></formio>
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.student.profile);

    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    return {
      StudentRoutesConst,
      user,
      goToStudentApplication,
    };
  },
};
</script>
