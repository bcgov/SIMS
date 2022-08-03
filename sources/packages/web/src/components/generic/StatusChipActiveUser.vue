<template>
  <status-chip :status="chipStatus" :label="chipLabel" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/ChipStatus.vue";
import { StatusChipTypes } from "@/components/generic/StatusChip.models";
export default {
  components: { StatusChip },
  props: {
    isActive: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const chipStatus = computed(() =>
      props.isActive ? StatusChipTypes.Success : StatusChipTypes.Inactive,
    );

    const chipLabel = computed(() => (props.isActive ? "Active" : "Inactive"));
    return { chipStatus, chipLabel };
  },
};
</script>
