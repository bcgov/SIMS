<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useInvoiceBatchApprovalStatus } from "@/composables";
import { CASInvoiceBatchApprovalStatus } from "@/types";

export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<CASInvoiceBatchApprovalStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapInvoiceBatchApprovalStatus } = useInvoiceBatchApprovalStatus();
    const chipStatus = computed(() =>
      mapInvoiceBatchApprovalStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
