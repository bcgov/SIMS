<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useDesignationAgreement } from "@/composables";
import { DesignationAgreementStatus } from "@/services/http/dto";

export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<DesignationAgreementStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapDesignationChipStatus } = useDesignationAgreement();
    const chipStatus = computed(() => mapDesignationChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
