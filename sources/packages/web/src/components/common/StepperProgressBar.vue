<template>
  <v-slider
    v-model="currentStatus"
    :ticks="ticks"
    :max="maximumAllowedProgressValue"
    step="1"
    show-ticks="always"
    tick-size="0"
    track-color="readonly"
    :track-fill-color="progressBarColor"
    :thumb-size="initialStepSize"
    :thumb-color="initialStepColor"
    track-size="20"
    readonly
    :disabled="disabled"
    class="stepper-progress-slider mt-n2"
  >
    <template #tick-label="{ tick, index }">
      <span v-if="index === currentStatus" class="label-bold black-color"
        >{{ tick.label }}
        <v-icon
          v-if="progressLabelIcon"
          :icon="progressLabelIcon"
          :size="20"
          :color="progressLabelIconColor"
      /></span>
      <span class="label-value black-color" v-else>{{ tick.label }} </span>
    </template>
  </v-slider>
</template>
<script lang="ts">
import { PropType, defineComponent, computed } from "vue";

export default defineComponent({
  props: {
    progressStepLabels: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
    progressBarValue: {
      type: Number,
      required: true,
    },
    progressBarColor: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    initialStepSize: {
      type: Number,
      required: false,
      default: 0,
    },
    initialStepColor: {
      type: String,
      required: false,
      default: "warning",
    },
    progressLabelIcon: {
      type: String,
      required: false,
    },
    progressLabelIconColor: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const ticks = computed<Record<number, string>>(() => {
      const labels = {} as Record<number, string>;
      props.progressStepLabels.forEach((label, labelIndex) => {
        labels[labelIndex] = label;
      });
      return labels;
    });
    const currentStatus = computed(() => props.progressBarValue);
    const maximumAllowedProgressValue = computed(
      () => Object.entries(props.progressStepLabels).length - 1,
    );

    return {
      currentStatus,
      maximumAllowedProgressValue,
      ticks,
    };
  },
});
</script>
