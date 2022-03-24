<template>
  <formio :formName="formName" @loaded="formLoaded"></formio>
</template>
<script lang="ts">
import { SetupContext } from "vue";
import formio from "@/components/generic/formio.vue";

export default {
  components: { formio },
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
