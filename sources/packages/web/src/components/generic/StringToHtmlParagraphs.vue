<!--
Used when texts have line breaks (\n) and we need to display
this line breaks as HTML paragraphs.
-->
<template v-if="paragraphs">
  <div v-for="paragraph in paragraphs" :key="paragraph">
    <p>{{ paragraph }}</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
export default defineComponent({
  props: {
    text: String,
  },
  setup(props) {
    const paragraphs = computed(() => {
      if (!props.text) {
        return null;
      }

      if (props.text.indexOf("\n")) {
        return props.text.split("\n");
      }

      return props.text;
    });

    return { paragraphs };
  },
});
</script>
