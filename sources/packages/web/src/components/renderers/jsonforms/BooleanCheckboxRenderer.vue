<script setup lang="ts">
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const onUpdate = (value: boolean) => handleChange(control.value.path, value);
</script>

<template>
  <v-checkbox
    v-if="control.visible"
    color="primary"
    density="compact"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :label="control.label"
    hide-details="auto"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  />
</template>
