<template>
  <status-chip :status="chipStatus" :label="status" :defaultBadge="false" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/StatusChip.vue";
import { useStudentRestriction } from "@/composables";
export default {
  components: { StatusChip },
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
};
</script>
