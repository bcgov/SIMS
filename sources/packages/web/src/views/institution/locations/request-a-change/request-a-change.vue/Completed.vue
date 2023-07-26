<template>
  <completed-offering-change-summary :location-id="locationId" />
</template>

<script lang="ts">
import CompletedOfferingChangeSummary from "@/components/institutions/request-a-change/CompletedOfferingChangeSummary.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    CompletedOfferingChangeSummary,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
});
</script>
