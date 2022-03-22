<template>
  <formio :formName="formName" @loaded="formLoaded"></formio>
</template>
<script lang="ts">
import formio from "@/components/generic/formio.vue";

export default {
  components: { formio },
  emits: ["appealFormLoaded"],
  props: {
    formName: {
      type: String,
      required: false,
    },
  },
  setup(props: any, context: any) {
    const formLoaded = (form: any) => {
      context.emit("appealFormLoaded", form);
    };
    return { formLoaded };
  },
};
</script>
