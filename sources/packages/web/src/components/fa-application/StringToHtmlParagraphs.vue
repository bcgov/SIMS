<template>
  <div v-for="paragraph in paragraphs" :key="paragraph">
    <p>{{ paragraph }}</p>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const paragraphs = computed(() => {
      if (props.text.indexOf("\n")) {
        return props.text.split("\n");
      }

      return props.text;
    });

    return { paragraphs };
  },
};
</script>
