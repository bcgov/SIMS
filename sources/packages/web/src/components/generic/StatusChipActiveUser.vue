<template>
  <chip-status :status="chipStatus" :label="chipLabel" />
</template>
<script lang="ts">
import { computed } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { StatusChipTypes } from "@/components/generic/StatusChip.models";
export default {
  components: { ChipStatus },
  props: {
    isActive: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const chipStatus = computed(() =>
      props.isActive ? StatusChipTypes.Success : StatusChipTypes.Default,
    );

    const chipLabel = computed(() => (props.isActive ? "Active" : "Inactive"));
    return { chipStatus, chipLabel };
  },
};
</script>
