<script setup lang="ts">
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const onUpdate = (value: string) => handleChange(control.value.path, value);
</script>

<template>
  <v-text-field
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    density="compact"
    variant="outlined"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  />
</template>
