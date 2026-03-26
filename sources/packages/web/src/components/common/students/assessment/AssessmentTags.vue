<template>
  <chip-tag v-if="showReversed" color="error" label="Reversed" />
  <chip-tag
    v-if="showUnsuccessfulCompletion"
    color="black"
    label="Unsuccessful Completion"
  />
  <chip-tag v-if="showWithdrawal" color="black" label="Withdrawal" />
  <chip-tag
    v-if="showNonPunitiveWithdrawal"
    class="non-punitive-tag"
    label="Non-Punitive"
  />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { AssessmentHistorySummaryAPIOutDTO } from "@/services/http/dto";
import { StudentScholasticStandingChangeType } from "@/types";

export default defineComponent({
  props: {
    assessment: {
      type: Object as PropType<AssessmentHistorySummaryAPIOutDTO>,
      required: true,
    },
  },
  setup(props) {
    const showReversed = computed(() => {
      return !!props.assessment.scholasticStandingReversalDate;
    });
    const showUnsuccessfulCompletion = computed(() => {
      return (
        props.assessment.scholasticStandingChangeType ===
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram &&
        !props.assessment.scholasticStandingReversalDate
      );
    });
    const showWithdrawal = computed(() => {
      return (
        props.assessment.scholasticStandingChangeType ===
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram &&
        !props.assessment.scholasticStandingReversalDate
      );
    });
    const showNonPunitiveWithdrawal = computed(() => {
      return (
        props.assessment.scholasticStandingChangeType ===
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram &&
        !!props.assessment.nonPunitiveFormSubmissionItemId
      );
    });
    return {
      showReversed,
      showUnsuccessfulCompletion,
      showWithdrawal,
      showNonPunitiveWithdrawal,
      StudentScholasticStandingChangeType,
    };
  },
});
</script>
