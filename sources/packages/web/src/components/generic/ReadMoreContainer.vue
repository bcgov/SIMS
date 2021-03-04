<!--
Used when we need to display some partial view of a longer text and we would like
to give the option for the user to expand the content only if he wants it.
It basically provides a "Read More/Read Less" like option on the page.
-->
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
    // By default the long text will be collapsed with the link option of "Read More".
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
