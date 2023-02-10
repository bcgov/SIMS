<template>
  <chip-label :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import ChipLabel from "@/components/generic/ChipLabel.vue";
import { useStudentRestriction } from "@/composables";

export default defineComponent({
  components: { ChipLabel },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapStudentRestrictionChipStatus } = useStudentRestriction();
    const chipStatus = computed(() =>
      mapStudentRestrictionChipStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
