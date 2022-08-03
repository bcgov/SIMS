<template>
  <status-chip :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/ChipStatus.vue";
import { useActiveApplication } from "@/composables";
export default {
  components: { StatusChip },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapActiveApplicationChipStatus } = useActiveApplication();
    const chipStatus = computed(() =>
      mapActiveApplicationChipStatus(props.status),
    );
    return { chipStatus };
  },
};
</script>
