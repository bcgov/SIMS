<template>
  <chip-status :status="chipStatus" :label="bypassStatus" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { ApplicationRestrictionBypassStatus } from "@/services/http/dto";
import { useBypassStatus } from "@/composables";

export default defineComponent({
  components: { ChipStatus },
  props: {
    isActive: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
  },
  setup(props) {
    const { mapBypassStatus } = useBypassStatus();
    const bypassStatus = props.isActive
      ? ApplicationRestrictionBypassStatus.Active
      : ApplicationRestrictionBypassStatus.Removed;
    const chipStatus = computed(() => mapBypassStatus(bypassStatus));
    return { chipStatus, bypassStatus };
  },
});
</script>
