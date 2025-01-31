<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useInvoiceBatch } from "@/composables";
import { CASInvoiceBatchApprovalStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<CASInvoiceBatchApprovalStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapInvoiceBatchApprovalStatus } = useInvoiceBatch();
    const chipStatus = computed(() =>
      mapInvoiceBatchApprovalStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
