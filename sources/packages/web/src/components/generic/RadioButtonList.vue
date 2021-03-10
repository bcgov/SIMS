<template>
  <div class="p-my-4">
    <div
      v-for="option in options"
      :key="option.value"
      class="p-field-radiobutton"
      @click="onClick(option.value)"
    >
      <div class="p-radiobutton p-component">
        <div class="p-hidden-accessible">
          <input
            type="radio"
            :id="getUniqueId(name, option.value)"
            :name="name"
            :value="option.value"
            :checked="modelValue === option.value"
          />
        </div>
        <div
          class="p-radiobutton-box"
          :class="[
            'p-radiobutton-box',
            {
              'p-highlight': modelValue === option.value,
              'p-disabled': $attrs.disabled,
            },
          ]"
          role="radio"
          aria-checked="false"
        >
          <div class="p-radiobutton-icon"></div>
        </div>
      </div>
      <label :for="getUniqueId(name, option.value)">{{ option.text }}</label>
    </div>
  </div>
</template>

<script lang="ts">
import { SetupContext } from "vue";
export default {
  emits: ["click", "update:modelValue", "change"],
  props: {
    modelValue: null,
    name: {
      type: String,
      required: true,
    },
    options: {
      type: Array,
      required: true,
      default: function() {
        return [
          { text: "Yes", value: "yes" },
          { text: "No", value: "no" },
        ];
      },
    },
  },
  setup(props: any, context: SetupContext) {
    const getUniqueId = (name: string, value: string) => {
      return `${name}_${value}`;
    };

    const onClick = (optionValue: string) => {
      context.emit("update:modelValue", optionValue);
    };

    return {
      getUniqueId,
      onClick,
    };
  },
};
</script>

<style lang="scss"></style>
