<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsEnumControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps(rendererProps<ControlElement>());
// Plain "enum" (raw values, no separate title) rather than "oneOf" -
// matches the lookup-backed fields this renderer targets, which are stored
// as regular string enums. The dropdown label falls back to the raw value
// itself when no title/i18n mapping is configured.
const { control, handleChange } = useJsonFormsEnumControl(props);

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
