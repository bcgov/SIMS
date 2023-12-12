<template>
  <title-value propertyTitle="Disability status">
    <template #value
      >{{ disabilityStatusToDisplay(disabilityStatus) }}
      <v-btn v-if="allowDisabilityStatusUpdate" variant="text" color="primary"
        ><span class="text-decoration-underline font-bold"
          >Update disability status</span
        ></v-btn
      ></template
    >
  </title-value>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent, PropType } from "vue";
import { StudentService } from "@/services/StudentService";
import { useFormatters } from "@/composables";
import { DisabilityStatus } from "@/types";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    disabilityStatus: {
      type: String as PropType<DisabilityStatus>,
      required: true,
    },
    allowDisabilityStatusUpdate: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { disabilityStatusToDisplay } = useFormatters();

    return {
      disabilityStatusToDisplay,
    };
  },
});
</script>
