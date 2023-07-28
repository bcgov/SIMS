<template>
  <available-to-change-summary :location-id="locationId" />
</template>

<script lang="ts">
import AvailableToChangeSummary from "@/components/institutions/request-a-change/AvailableToChangeSummary.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    AvailableToChangeSummary,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
});
</script>
