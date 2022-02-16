<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <LocationSummary :institutionId="institutionId" />
    </div>
  </v-card>
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";

export default {
  components: { LocationSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
};
</script>
