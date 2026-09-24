<script setup lang="ts">
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import { useClearDataWhenHidden } from "./useClearDataWhenHidden";
import type { ControlElement } from "@jsonforms/core";
import RadioOptionsYesNo from "@/components/generic/RadioOptionsYesNo.vue";
import { computed } from "vue";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const onUpdate = (value: string) => handleChange(control.value.path, value);

// While hidden (e.g. isAviationProgram is "no"), the schema's `else` branch
// requires this property to be entirely absent, so clear any stale value
// rather than leaving one behind that would fail validation on submit.
useClearDataWhenHidden(
  computed(() => control.value.visible),
  computed(() => control.value.path),
  handleChange,
);

// Optional tooltip next to the label - options.tooltipHtml renders rich
// content (e.g. a bullet list), options.tooltip renders plain text.
const tooltip = computed(
  () => control.value.uischema.options?.tooltip as string | undefined,
);
const tooltipHtml = computed(
  () => control.value.uischema.options?.tooltipHtml as string | undefined,
);
</script>

<template>
  <radio-options-yes-no
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  >
    <template v-if="tooltip || tooltipHtml" #label>
      <span>{{ control.label }}</span
      ><tooltip-icon :max-width="670"
        ><span v-if="tooltipHtml" v-html="tooltipHtml"></span
        ><template v-else>{{ tooltip }}</template></tooltip-icon
      >
    </template>
  </radio-options-yes-no>
</template>
