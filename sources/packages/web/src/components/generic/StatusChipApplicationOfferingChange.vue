<template>
  <chip-status :status="chipStatus" :label="status" />
</template>

<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
import { useApplicationOfferingChange } from "@/composables";
import { ApplicationOfferingChangeRequestStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<ApplicationOfferingChangeRequestStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapApplicationOfferingChangeChipStatus } =
      useApplicationOfferingChange();
    const chipStatus = computed(() =>
      mapApplicationOfferingChangeChipStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
