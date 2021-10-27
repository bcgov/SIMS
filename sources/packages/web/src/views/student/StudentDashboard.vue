<template>
  <v-container>
    <RestrictionBanner
      v-if="hasRestriction"
      :restrictionMessage="restrictionMessage"
    />
    <formio formName="studentdashboard"></formio>
  </v-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed, onMounted, ref } from "vue";
import { useStore } from "vuex";
import { StudentService } from "@/services/StudentService";
import formio from "@/components/generic/formio.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
export default {
  components: { formio, RestrictionBanner },
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);
    const hasRestriction = ref(true);
    const restrictionMessage = ref("");
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
    };
  },
};
</script>
