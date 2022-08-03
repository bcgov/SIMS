<template>
  <status-chip :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, PropType } from "vue";
import StatusChip from "@/components/generic/ChipStatus.vue";
import { useApplication } from "@/composables";
import { ApplicationStatus } from "@/types";

export default {
  components: { StatusChip },
  props: {
    status: {
      type: String as PropType<ApplicationStatus>,
      required: true,
    },
  },
  setup(props: any) {
    const { mapApplicationChipStatus } = useApplication();
    const chipStatus = computed(() => mapApplicationChipStatus(props.status));
    return { chipStatus };
  },
};
</script>
