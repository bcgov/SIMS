<template>
  <chip-label :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import ChipLabel from "@/components/generic/ChipLabel.vue";
import { useLocation } from "@/composables";
export default {
  components: { ChipLabel },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapDesignationChipStatus } = useLocation();
    const chipStatus = computed(() => mapDesignationChipStatus(props.status));
    return { chipStatus };
  },
};
</script>
