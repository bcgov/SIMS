<template>
  <RestrictionBanner
    v-if="hasRestriction"
    :restrictionMessage="restrictionMessage"
  />
  <CheckValidSINBanner />
  <div class="p-m-4">
    <h1>Notifications - To be developed!</h1>
  </div>
</template>
<script lang="ts">
import { ref } from "vue";
// import { StudentService } from "@/services/StudentService";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
export default {
  components: { RestrictionBanner, CheckValidSINBanner },
  setup() {
    // TODO: update this in restriction UI ticket
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");

    return {
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>
