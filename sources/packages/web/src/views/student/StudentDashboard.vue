<template>
  <full-page-container layout-template="Centered">
    <template #alerts>
      <RestrictionBanner
        v-if="hasRestriction"
        :restrictionMessage="restrictionMessage"
      />
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
import { computed, onMounted, ref } from "vue";

import { useStore } from "vuex";
import { StudentService } from "@/services/StudentService";
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
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");

    const goToStudentApplication = async () => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
      });
    };

    onMounted(async () => {
      const studentRestriction =
        await StudentService.shared.getStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
    });
    return {
      StudentRoutesConst,
      user,
      hasRestriction,
      restrictionMessage,
      goToStudentApplication,
    };
  },
};
</script>
