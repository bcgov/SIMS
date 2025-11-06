<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useStudentAppeals } from "@/composables";
import { StudentAppealStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<StudentAppealStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapStudentAppealChipStatus } = useStudentAppeals();
    const chipStatus = computed(() => mapStudentAppealChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
