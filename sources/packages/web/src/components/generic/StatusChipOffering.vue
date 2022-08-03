<template>
  <status-chip :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/ChipStatus.vue";
import { useOffering } from "@/composables";
export default {
  components: { StatusChip },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapOfferingChipStatus } = useOffering();
    const chipStatus = computed(() => mapOfferingChipStatus(props.status));
    return { chipStatus };
  },
};
</script>
