<template>
  <div>
    <slot></slot>
    <div id="extendedContent" v-show="isExtended">
      <slot name="extended"></slot>
    </div>
    <a id="toggleButton" @click.prevent="toggleExtended" href="#">{{
      extendedLabel
    }}</a>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
export default {
  props: {
    collapsedText: {
      type: String,
      default: "Read More",
      required: true,
    },
    expandedText: {
      type: String,
      default: "Read Less",
      required: true,
    },
  },
  setup(props: any) {
    const isExtended = ref(false);
    const extendedLabel = ref(props.collapsedText);

    const toggleExtended = () => {
      isExtended.value = !isExtended.value;
      extendedLabel.value = isExtended.value
        ? props.expandedText
        : props.collapsedText;
    };

    return { isExtended, extendedLabel, toggleExtended };
  },
};
</script>
