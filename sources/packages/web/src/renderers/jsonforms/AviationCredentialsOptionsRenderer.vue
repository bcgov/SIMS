<script setup lang="ts">
import { computed, watch } from "vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";
import { useClearDataWhenHidden } from "./useClearDataWhenHidden";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

// The schema is a fixed object of named boolean properties (one per
// currently active lookup value, resolved server-side - see
// ProgramFormDynamicSchema.poc.ts), not an array/enum, so options come from
// control.schema.properties rather than control.options.
const propertyKeys = computed(() =>
  Object.keys(control.value.schema.properties ?? {}),
);
const items = computed(() =>
  propertyKeys.value.map((key) => {
    const subSchema = control.value.schema.properties?.[key] as JsonSchema;
    return { title: subSchema?.title ?? key, value: key };
  }),
);

// CheckboxOptionsGroup operates on an array of the currently-selected keys;
// the control's actual data is an object of { key: boolean }, so the two
// shapes are translated at this renderer's boundary.
const selectedKeys = computed(() =>
  propertyKeys.value.filter((key) => control.value.data?.[key] === true),
);

const onUpdate = (newSelectedKeys: (string | number)[]) => {
  const updatedValue = Object.fromEntries(
    propertyKeys.value.map((key) => [key, newSelectedKeys.includes(key)]),
  );
  handleChange(control.value.path, updatedValue);
};

// While hidden (e.g. isAviationProgram is "no"), the schema's `else` branch
// requires this property to be entirely absent, so clear any stale value
// rather than leaving one behind that would fail validation on submit.
useClearDataWhenHidden(
  computed(() => control.value.visible),
  computed(() => control.value.path),
  handleChange,
);

// While visible, ensure every known option has an explicit true/false entry
// in the persisted data, matching the target output shape, rather than only
// appearing once a user first interacts with a checkbox.
watch(
  () => control.value.visible,
  (visible) => {
    if (!visible) {
      return;
    }
    const hasAllKeys = propertyKeys.value.every(
      (key) => typeof control.value.data?.[key] === "boolean",
    );
    if (!hasAllKeys) {
      onUpdate(selectedKeys.value);
    }
  },
  { immediate: true },
);
</script>

<template>
  <checkbox-options-group
    v-if="control.visible"
    :model-value="selectedKeys"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    color="primary"
  ></checkbox-options-group>
</template>
