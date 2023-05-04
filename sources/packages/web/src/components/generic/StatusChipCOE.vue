<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useCOE } from "@/composables";
import { COEStatus } from "@/types";
export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<COEStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapCOEChipStatus } = useCOE();
    const chipStatus = computed(() => mapCOEChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
