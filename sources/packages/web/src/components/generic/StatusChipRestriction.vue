<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useRestriction } from "@/composables";
import { RestrictionStatus } from "@/types";
export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<RestrictionStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapRestrictionChipStatus } = useRestriction();
    const chipStatus = computed(() => mapRestrictionChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
