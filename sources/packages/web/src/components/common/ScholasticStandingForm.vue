<template>
  <formio formName="reportscholasticstandingchange" :data="data"></formio>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import { ScholasticStandingSubmittedDetails } from "@/types";
interface ReadOnlyScholasticStanding
  extends ScholasticStandingSubmittedDetails {
  readonly: boolean;
}

export default {
  props: {
    initialData: {
      type: Object,
      required: true,
    },
  },
  setup(props: any) {
    const data = ref({} as ReadOnlyScholasticStanding);
    const setReadOnlyData = () => {
      data.value = { ...props.initialData, readOnly: true };
    };
    watch(
      () => props.initialData,
      async () => {
        setReadOnlyData();
      },
      { immediate: true },
    );
    return { data };
  },
};
</script>
