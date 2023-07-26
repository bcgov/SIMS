<template>
  <available-to-change-summary :location-id="locationId" />
</template>

<script lang="ts">
import AvailableToChangeSummary from "@/components/institutions/request-a-change/AvailableToChangeSummary.vue";
import { defineComponent, onMounted } from "vue";

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
  setup(props) {
    onMounted(async () => {
      console.log(props.locationId, "++++");
    });
  },
});
</script>
