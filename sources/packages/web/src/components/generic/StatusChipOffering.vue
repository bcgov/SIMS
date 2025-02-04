<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useOffering } from "@/composables";
import { OfferingStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<OfferingStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapOfferingChipStatus } = useOffering();
    const chipStatus = computed(() => mapOfferingChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
