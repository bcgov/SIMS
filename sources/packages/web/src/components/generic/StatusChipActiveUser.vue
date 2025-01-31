<template>
  <chip-status :status="chipStatus" :label="chipLabel" />
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { StatusChipTypes } from "@/types";

export default defineComponent({
  props: {
    isActive: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const chipStatus = computed(() =>
      props.isActive ? StatusChipTypes.Success : StatusChipTypes.Default,
    );

    const chipLabel = computed(() => (props.isActive ? "Active" : "Inactive"));
    return { chipStatus, chipLabel };
  },
});
</script>
