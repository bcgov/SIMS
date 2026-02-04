<template>
  <chip-label :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useLocation } from "@/composables";
import { DesignationAgreementStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<DesignationAgreementStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapDesignationChipStatus } = useLocation();
    const chipStatus = computed(() => mapDesignationChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
