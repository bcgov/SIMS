<template>
  <component :is="headingTag">{{ title }}</component>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
      validator: (value: number) => [1, 2, 3].includes(value),
    },
  },
  setup(props) {
    const headingTag = computed(() => {
      console.log("props.title", props.title);
      return `h${props.level}`;
    });
    return { headingTag };
  },
});
</script>
