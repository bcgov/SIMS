<template>
  <formio :formName="formName" @loaded="formLoaded"></formio>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["appealFormLoaded"],
  props: {
    formName: {
      type: String,
      required: true,
    },
  },
  setup(_props, context) {
    const formLoaded = (form: any) => {
      context.emit("appealFormLoaded", form);
    };
    return { formLoaded };
  },
});
</script>
