<template>
  <full-page-container layout-template="centered">
    <template #alerts>
      <restriction-banner />
      <CheckValidSINBanner />
    </template>
    <formio
      formName="studentwelcomepage"
      @customEvent="goToStudentApplication"
    ></formio>
  </full-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed } from "vue";
import { useStore } from "vuex";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import { useRouter } from "vue-router";

export default {
  components: {
    RestrictionBanner,
    CheckValidSINBanner,
  },
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
