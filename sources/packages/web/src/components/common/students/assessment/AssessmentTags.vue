<template>
  <!-- Reversed takes precedence over Unsuccessful Completion and Withdrawal -->
  <chip-tag
    v-if="!!assessment.scholasticStandingReversalDate"
    :type="ChipTagTypes.Red"
    label="Reversed"
  />
  <chip-tag
    v-else-if="
      assessment.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentDidNotCompleteProgram
    "
    :type="ChipTagTypes.Black"
    label="Unsuccessful Completion"
  />
  <chip-tag
    v-else-if="
      assessment.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentWithdrewFromProgram
    "
    :type="ChipTagTypes.Black"
    label="Withdrawal"
  />
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
import ChipTag from "@/components/generic/ChipTag.vue";
import { AssessmentHistorySummaryAPIOutDTO } from "@/services/http/dto";
import { StudentScholasticStandingChangeType, ChipTagTypes } from "@/types";

export default defineComponent({
  components: { ChipTag },
  props: {
    assessment: {
      type: Object as PropType<AssessmentHistorySummaryAPIOutDTO>,
      required: true,
    },
  },
  setup() {
    return {
      StudentScholasticStandingChangeType,
      ChipTagTypes,
    };
  },
});
</script>
