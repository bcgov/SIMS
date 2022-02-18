<template>
  <v-container>
    <RestrictionBanner
      v-if="hasRestriction"
      :restrictionMessage="restrictionMessage"
    />
    <CheckValidSINBanner />
    <formio
      formName="studentwelcomepage"
      @submitted="goToStudentApplication"
    ></formio>
  </v-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed, onMounted, ref } from "vue";

import { useStore } from "vuex";
import { StudentService } from "@/services/StudentService";
import formio from "@/components/generic/formio.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import { useRouter } from "vue-router";
import { useToastMessage } from "@/composables";

export default {
  emits: ["goToStudentApplication"],
  components: {
    formio,
    RestrictionBanner,
    CheckValidSINBanner,
  },
  setup() {
    const toast = useToastMessage();
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
      const studentRestriction = await StudentService.shared.getStudentRestriction();
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
