<template>
  <chip-label :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipLabel from "@/components/generic/ChipLabel.vue";
import { useLocation } from "@/composables";
import { DesignationAgreementStatus } from "@/types";

export default defineComponent({
  components: { ChipLabel },
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
