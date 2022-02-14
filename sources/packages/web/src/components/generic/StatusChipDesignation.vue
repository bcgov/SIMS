<template>
  <status-chip :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/StatusChip.vue";
import { useDesignationAgreement } from "@/composables";
export default {
  components: { StatusChip },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapDesignationChipStatus } = useDesignationAgreement();
    const chipStatus = computed(() => mapDesignationChipStatus(props.status));
    return { chipStatus };
  },
};
</script>
