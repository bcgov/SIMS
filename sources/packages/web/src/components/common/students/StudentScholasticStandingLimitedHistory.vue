<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header title="Scholastic Standing Limited History" />
    </template>
    <content-group
      ><p v-if="showPartTimeSummary" class="label-bold-normal">
        Number of Lifetime Weeks of Unsuccessful Completion for Part-time
        studies:
        {{
          scholasticStandingSummary.partTimeLifetimeUnsuccessfulCompletionWeeks
        }}
      </p>
      <p class="label-bold-normal">
        Number of Lifetime Weeks of Unsuccessful Completion for Full-time
        studies:
        {{
          scholasticStandingSummary.fullTimeLifetimeUnsuccessfulCompletionWeeks
        }}
      </p></content-group
    >
  </body-header-container>
</template>
<script lang="ts">
import { ScholasticStandingSummaryDetailsAPIOutDTO } from "@/services/http/dto";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { defineComponent, onMounted, ref } from "vue";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    showPartTimeSummary: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const scholasticStandingSummary = ref(
      {} as ScholasticStandingSummaryDetailsAPIOutDTO,
    );
    onMounted(async () => {
      scholasticStandingSummary.value =
        await ScholasticStandingService.shared.getScholasticStandingSummary({
          studentId: props.studentId,
        });
    });
    return { scholasticStandingSummary };
  },
});
</script>
