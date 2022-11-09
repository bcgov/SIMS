<template>
  <formio
    :formName="formName"
    :data="formData"
    :readOnly="readOnly"
    @loaded="formLoaded"
    @customEvent="formCustomEvent"
    @render="formRender"
    @changed="formChanged"
  ></formio>
  <slot name="actions" :submit="submit"></slot>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { FormIOChangeEvent, FormIOForm } from "@/types";
import { useFormioUtils } from "@/composables";
export default defineComponent({
  emits: ["submitted", "loaded", "customEvent", "render", "changed"],
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
  setup(_props, context) {
    const { checkFormioValidity } = useFormioUtils();
    let formioForm: FormIOForm;

    const formLoaded = (form: FormIOForm) => {
      formioForm = form;
      context.emit("loaded", form);
    };

    const submit = async (args: unknown) => {
      if (await checkFormioValidity([formioForm])) {
        context.emit("submitted", formioForm, args);
      }
    };

    const formRender = () => {
      context.emit("render");
    };

    const formChanged = (form: FormIOForm, event: FormIOChangeEvent) => {
      context.emit("changed", form, event);
    };

    const formCustomEvent = (form: FormIOForm, event: any) => {
      context.emit("customEvent", form, event);
    };

    return { formLoaded, submit, formRender, formChanged, formCustomEvent };
  },
});
</script>
