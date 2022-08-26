<template>
  <formio
    :formName="formName"
    :data="formData"
    :readOnly="readOnly"
    @loaded="formLoaded"
    @customEvent="$emit('customEvent', $event)"
    @render="formRender"
  ></formio>
  <slot name="actions" :submit="submit"></slot>
</template>
<script lang="ts">
import { SetupContext } from "vue";
import { FormIOForm } from "@/types";
import { useFormioUtils } from "@/composables";
export default {
  emits: ["submitted", "loaded", "customEvent", "render"],
  props: {
    formName: {
      type: String,
      required: true,
    },
    formData: {
      type: Object,
      required: false,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(_props: any, context: SetupContext) {
    const { checkFormioValidity } = useFormioUtils();
    let formioForm: FormIOForm;

    const formLoaded = (form: FormIOForm) => {
      formioForm = form;
      context.emit("loaded", form);
    };

    const submit = async () => {
      if (await checkFormioValidity([formioForm])) {
        context.emit("submitted", formioForm);
      }
    };
    const formRender = () => {
      context.emit("render");
    };
    return { formLoaded, submit, formRender };
  },
};
</script>
