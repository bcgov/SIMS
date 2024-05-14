<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header
        title="Scholastic Standing Limited History"
        title-header-level="2"
      />
    </template>
    <content-group
      ><p class="label-bold-normal">
        Number of Lifetime Weeks of Unsuccessful Completion:
        {{ scholasticStandingSummary.lifetimeUnsuccessfulCompletionWeeks }}
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
