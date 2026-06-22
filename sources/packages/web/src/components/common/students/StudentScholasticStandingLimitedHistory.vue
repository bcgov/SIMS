<template>
  <body-header-container :enable-card-view="true">
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
      </p>
      <p class="label-bold-normal">
        Number of full-time withdrawals from study:
        {{ scholasticStandingSummary.fullTimeWithdrawalsCount }}
      </p></content-group
    >
  </body-header-container>
</template>
<script setup lang="ts">
import { ScholasticStandingSummaryDetailsAPIOutDTO } from "@/services/http/dto";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { onMounted, ref } from "vue";

interface Props {
  studentId?: number;
  showPartTimeSummary?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  studentId: undefined,
  showPartTimeSummary: true,
});

const scholasticStandingSummary = ref(
  {} as ScholasticStandingSummaryDetailsAPIOutDTO,
);

onMounted(async () => {
  scholasticStandingSummary.value =
    await ScholasticStandingService.shared.getScholasticStandingSummary({
      studentId: props.studentId,
    });
});
</script>
