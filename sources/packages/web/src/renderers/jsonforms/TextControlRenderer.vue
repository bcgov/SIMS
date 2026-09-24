<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { useClearDataWhenHidden } from "./useClearDataWhenHidden";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const onUpdate = (value: string) => handleChange(control.value.path, value);

useClearDataWhenHidden(
  computed(() => control.value.visible),
  computed(() => control.value.path),
  handleChange,
);

const multiline = computed(
  () => !!control.value.uischema.options?.multiline,
);
const hint = computed(
  () => control.value.uischema.options?.hint as string | undefined,
);
const counter = computed(() => control.value.schema.maxLength);
</script>

<template>
  <v-textarea
    v-if="control.visible && multiline"
    :model-value="control.data"
    @update:model-value="onUpdate"
    variant="outlined"
    :label="control.label"
    :counter="counter"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  />
  <v-text-field
    v-else-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    density="compact"
    variant="outlined"
    :label="control.label"
    :counter="counter"
    :hint="hint"
    :persistent-hint="!!hint"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  />
</template>
