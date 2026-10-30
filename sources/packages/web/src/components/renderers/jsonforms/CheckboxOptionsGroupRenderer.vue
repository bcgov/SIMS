<template>
  <checkbox-options-group
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
    color="primary"
  ></checkbox-options-group>
</template>
<script setup lang="ts">
import { computed } from "vue";
import {
  rendererProps,
  useDispatch,
  useJsonFormsMultiEnumControl,
} from "@jsonforms/vue";
import { update, type ControlElement } from "@jsonforms/core";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";
import { useClearDataWhenHidden } from "./useClearDataWhenHidden";

const props = defineProps(rendererProps<ControlElement>());
const { control } = useJsonFormsMultiEnumControl(props);
const dispatch = useDispatch();

// CheckboxOptionsGroup expects { title, value } items; JSONForms derives
// { label, value } EnumOptions from the schema's items.enum (or items.oneOf).
const items = computed(() =>
  control.value.options.map((option) => ({
    title: option.label,
    value: option.value,
  })),
);

// Options that, once selected, must be the only selection
// (e.g. "None of the above"), declared via UI Schema options.
const exclusiveOptions = computed<(string | number)[]>(
  () => control.value.uischema.options?.exclusiveOptions ?? [],
);

const onUpdate = (newValue: (string | number)[]) => {
  const oldValue = (control.value.data ?? []) as (string | number)[];
  const added = newValue.filter((value) => !oldValue.includes(value));
  const addedExclusive = added.find((value) =>
    exclusiveOptions.value.includes(value),
  );
  let nextValue = newValue;
  if (addedExclusive !== undefined) {
    // An exclusive option was just checked - collapse down to it alone.
    nextValue = [addedExclusive];
  } else if (added.length) {
    // Something else was just checked - exclusive options no longer apply.
    nextValue = newValue.filter(
      (value) => !exclusiveOptions.value.includes(value),
    );
  }
  // Keep the selected values in the same order as the options.
  const data = items.value
    .map(({ value }) => value)
    .filter((value) => nextValue.includes(value));
  // useJsonFormsMultiEnumControl only exposes single-value addItem/removeItem,
  // so the whole array is replaced in one dispatch.
  dispatch(update(control.value.path, () => data));
};

useClearDataWhenHidden(
  computed(() => control.value.visible),
  computed(() => control.value.path),
  (path, value) => dispatch(update(path, () => value)),
);
</script>
