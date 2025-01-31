<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { SupplierStatus } from "@/services/http/dto";
import { useSupplier } from "@/composables";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<SupplierStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapSupplierChipStatus } = useSupplier();
    const chipStatus = computed(() => mapSupplierChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
