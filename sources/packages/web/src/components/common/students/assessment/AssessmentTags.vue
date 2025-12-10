<template>
  <chip-tag
    v-if="!!assessment.scholasticStandingReversalDate"
    color="error"
    label="Reversed"
  />
  <chip-tag
    v-else-if="
      assessment.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentDidNotCompleteProgram
    "
    color="black"
    label="Unsuccessful Completion"
  />
  <chip-tag
    v-else-if="
      assessment.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentWithdrewFromProgram
    "
    color="black"
    label="Withdrawal"
  />
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
import ChipTag from "@/components/generic/ChipTag.vue";
import { AssessmentHistorySummaryAPIOutDTO } from "@/services/http/dto";
import { StudentScholasticStandingChangeType } from "@/types";

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
    };
  },
});
</script>
