<template>
  <chip-label
    :label="badgeDetails.label"
    :status="badgeDetails.status"
    :custom-icon="badgeDetails.icon"
  />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { DisbursementScheduleStatus } from "@/types";
import { useDisbursement } from "@/composables/useDisbursement";

export default defineComponent({
  props: {
    status: {
      type: Object as PropType<DisbursementScheduleStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapDisbursementBadgeDetails } = useDisbursement();
    const badgeDetails = computed(() =>
      mapDisbursementBadgeDetails(props.status),
    );
    return { badgeDetails };
  },
});
</script>
