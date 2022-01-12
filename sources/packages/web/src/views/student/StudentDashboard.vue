<template>
  <full-page-container>
    <RestrictionBanner
      v-if="hasRestriction"
      :restrictionMessage="restrictionMessage"
    />
    <CheckValidSINBanner />
    <formio formName="studentdashboard"></formio>
  </full-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed, onMounted, ref } from "vue";

import { useStore } from "vuex";
import { StudentService } from "@/services/StudentService";
import formio from "@/components/generic/formio.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";

export default {
  components: {
    formio,
    FullPageContainer,
    RestrictionBanner,
    CheckValidSINBanner,
  },
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const isStoreDispatched = ref(false);

    onMounted(async () => {
      const studentInfo = await StudentService.shared.getStudentInfo();
      await store.dispatch("student/setHasValidSIN", studentInfo.validSin);
      const studentRestriction = await StudentService.shared.getStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
    });
    return {
      StudentRoutesConst,
      user,
      hasRestriction,
      restrictionMessage,
      isStoreDispatched,
    };
  },
};
</script>
