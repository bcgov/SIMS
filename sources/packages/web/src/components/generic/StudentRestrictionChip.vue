<template>
  <chip-label :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipLabel from "@/components/generic/ChipLabel.vue";
import { useStudentRestriction } from "@/composables";
import { StudentRestrictionStatus } from "@/types";

export default defineComponent({
  components: { ChipLabel },
  props: {
    status: {
      type: String as PropType<StudentRestrictionStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapStudentRestrictionChipStatus } = useStudentRestriction();
    const chipStatus = computed(() =>
      mapStudentRestrictionChipStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
