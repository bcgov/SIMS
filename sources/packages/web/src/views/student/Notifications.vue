<template>
  <RestrictionBanner
    v-if="hasRestriction"
    :restrictionMessage="restrictionMessage"
  />
  <div class="p-m-4">
    <h1>Notifications - To be developed!</h1>
  </div>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { StudentService } from "@/services/StudentService";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
export default {
  components: { RestrictionBanner },
  setup() {
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    onMounted(async () => {
      const studentRestriction = await StudentService.shared.getStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
    });
    return {
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>
