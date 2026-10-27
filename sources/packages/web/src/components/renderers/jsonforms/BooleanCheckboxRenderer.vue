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
<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { useClearDataWhenHidden } from "./useClearDataWhenHidden";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const onUpdate = (value: boolean) => handleChange(control.value.path, value);

useClearDataWhenHidden(
  computed(() => control.value.visible),
  computed(() => control.value.path),
  handleChange,
);
</script>
