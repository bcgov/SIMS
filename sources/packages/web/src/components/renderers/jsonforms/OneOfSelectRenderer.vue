<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps(rendererProps<ControlElement>());
// "oneOf" (const/title pairs) rather than a plain "enum" - matches the
// lookup-backed fields this renderer targets, where the display label
// differs from the stored value.
const { control, handleChange } = useJsonFormsOneOfEnumControl(props);

const onUpdate = (value: string) => handleChange(control.value.path, value);

// Optional hint text, set via the UI Schema's "options.hint" - matches the
// hint/persistent-hint usage already elsewhere on this project's v-select
// lookup fields.
const hint = computed(
  () => control.value.uischema.options?.hint as string | undefined,
);
</script>

<template>
  <v-select
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :items="control.options"
    item-title="label"
    item-value="value"
    density="compact"
    variant="outlined"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
    :hint="hint"
    :persistent-hint="!!hint"
  />
</template>
