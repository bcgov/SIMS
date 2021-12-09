<template>
  <LocationSummary
    :clientType="ClientIdType.AEST"
    :institutionId="institutionId"
  />
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";
import { ClientIdType } from "@/types";

export default {
  components: { LocationSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return { ClientIdType };
  },
};
</script>
