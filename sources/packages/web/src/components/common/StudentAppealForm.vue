<template>
  <formio :formName="formName" @loaded="formLoaded"></formio>
</template>
<script lang="ts">
import { SetupContext } from "vue";

export default {
  emits: ["appealFormLoaded"],
  props: {
    formName: {
      type: String,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const formLoaded = (form: any) => {
      context.emit("appealFormLoaded", form);
    };
    return { formLoaded };
  },
};
</script>
