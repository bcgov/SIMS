<template>
  <restriction-banner />
  <CheckValidSINBanner />
  <div class="p-m-4">
    <h1>Notifications - To be developed!</h1>
  </div>
</template>
<script lang="ts">
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
export default {
  components: { RestrictionBanner, CheckValidSINBanner },
};
</script>
