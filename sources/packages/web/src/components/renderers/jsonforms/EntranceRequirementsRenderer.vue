<script setup lang="ts">
import { computed } from "vue";
import {
  rendererProps,
  useDispatch,
  useJsonFormsMultiEnumControl,
} from "@jsonforms/vue";
import { update, type ControlElement } from "@jsonforms/core";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";
import { PROGRAM_ENTRANCE_REQUIREMENT_NONE } from "@/constants/program-constants";
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

const selected = computed(() => (control.value.data ?? []) as string[]);

const onUpdate = (newValue: Array<string | number>) => {
  const noneWasSelected = selected.value.includes(
    PROGRAM_ENTRANCE_REQUIREMENT_NONE,
  );
  let nextValue = newValue;
  if (noneWasSelected) {
    // Something else was just toggled alongside (or "none" was just
    // unchecked) - "none" no longer applies either way.
    nextValue = newValue.filter(
      (value) => value !== PROGRAM_ENTRANCE_REQUIREMENT_NONE,
    );
  } else if (newValue.includes(PROGRAM_ENTRANCE_REQUIREMENT_NONE)) {
    // "none" was just checked alongside possibly other selections -
    // collapse down to "none" alone.
    nextValue = [PROGRAM_ENTRANCE_REQUIREMENT_NONE];
  }
  // Keep the selected values in the same order as the options.
  const data =
    items.value
      ?.map(({ value }) => value)
      .filter((value) => nextValue.includes(value)) ?? [];
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

<template>
  <checkbox-options-group
    v-if="control.visible"
    color="primary"
    :model-value="selected"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  ></checkbox-options-group>
</template>
