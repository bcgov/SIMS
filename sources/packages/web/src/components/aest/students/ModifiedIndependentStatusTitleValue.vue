<template>
  <title-value property-title="Modified independent status">
    <template #value
      >{{ modifiedIndependentDisplayStatus }}
      <v-btn v-if="allowUpdateActions" variant="text" color="primary"
        ><span class="text-decoration-underline font-bold"
          >Update modified independent status</span
        ></v-btn
      ></template
    >
  </title-value>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useFormatters } from "@/composables";
import { ModifiedIndependentStatus } from "@/types";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    modifiedIndependentStatus: {
      type: String as PropType<ModifiedIndependentStatus>,
      required: true,
    },
    allowUpdateActions: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { modifiedIndependentStatusToDisplay } = useFormatters();
    const modifiedIndependentDisplayStatus = computed(() =>
      modifiedIndependentStatusToDisplay(props.modifiedIndependentStatus),
    );

    return {
      modifiedIndependentDisplayStatus,
    };
  },
});
</script>
