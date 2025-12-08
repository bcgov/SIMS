<template>
  <v-chip
    :border="0"
    class="ma-1 font-semibold"
    :class="chipClass"
    :color="chipColor"
    size="small"
    variant="outlined"
  >
    {{ label }}
  </v-chip>
</template>
<script lang="ts">
import { ChipTagTypes } from "@/types/contracts/ChipTag";
import { computed, defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    type: {
      type: Object as PropType<ChipTagTypes>,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const chipColor = computed(() => {
      switch (props.type) {
        case ChipTagTypes.Black:
          return "white";
        case ChipTagTypes.Red:
          return "red-darken-4";
        default:
          return "";
      }
    });
    const chipClass = computed(() => {
      switch (props.type) {
        case ChipTagTypes.Black:
          return "bg-black";
        case ChipTagTypes.Red:
          return "bg-red-lighten-5";
        default:
          return "";
      }
    });
    return {
      chipColor,
      chipClass,
    };
  },
});
</script>
