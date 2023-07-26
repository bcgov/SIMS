<template>
  <in-progress-offering-change-summary :location-id="locationId" />
</template>

<script lang="ts">
import InProgressOfferingChangeSummary from "@/components/institutions/request-a-change/InProgressOfferingChangeSummary.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    InProgressOfferingChangeSummary,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
});
</script>
