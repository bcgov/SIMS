<template>
  <status-info-label :status="StatusInfo.Rejected"
    >Certificate cancelled on {{ formattedDate }}</status-info-label
  >
  <p class="mt-3">
    This final award was cancelled and no awards will be disbursed. Please
    contact
    <a href="mailto:StudentAidBC@gov.bc.ca" rel="noopener" target="_blank"
      >StudentAid BC</a
    >
    to understand more about the next steps.
  </p>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { StatusInfo } from "@/types";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    cancellationDate: {
      type: Date,
      required: true,
    },
  },
  setup(props) {
    const { dateOnlyLongString } = useFormatters();
    const formattedDate = computed(() =>
      dateOnlyLongString(props.cancellationDate),
    );
    return {
      formattedDate,
      StatusInfo,
    };
  },
});
</script>
