<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useDesignationAgreement } from "@/composables";
export default {
  components: { ChipStatus },
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
