<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useCOE } from "@/composables";
export default {
  components: { ChipStatus },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapCOEChipStatus } = useCOE();
    const chipStatus = computed(() => mapCOEChipStatus(props.status));
    return { chipStatus };
  },
};
</script>
