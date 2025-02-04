<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useActiveApplication } from "@/composables";
import { ApplicationScholasticStandingStatus } from "@/types";
export default defineComponent({
  props: {
    status: {
      type: String as PropType<ApplicationScholasticStandingStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapActiveApplicationChipStatus } = useActiveApplication();
    const chipStatus = computed(() =>
      mapActiveApplicationChipStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
