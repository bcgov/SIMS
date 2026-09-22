<script setup lang="ts">
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import RadioOptionsYesNo from "@/components/generic/RadioOptionsYesNo.vue";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const onUpdate = (value: string) => handleChange(control.value.path, value);
</script>

<template>
  <radio-options-yes-no
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  ></radio-options-yes-no>
</template>
