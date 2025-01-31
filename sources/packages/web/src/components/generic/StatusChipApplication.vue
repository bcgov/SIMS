<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
import { useApplication } from "@/composables";
import { ApplicationStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<ApplicationStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapApplicationChipStatus } = useApplication();
    const chipStatus = computed(() => mapApplicationChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
