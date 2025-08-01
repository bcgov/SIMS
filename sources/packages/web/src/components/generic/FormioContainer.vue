<template>
  <formio
    :formName="formName"
    :data="formData"
    :readOnly="readOnly"
    :is-data-ready="isDataReady"
    @loaded="formLoaded"
    @customEvent="formCustomEvent"
    @render="formRender"
    @changed="formChanged"
  ></formio>
  <template v-if="isDataReady && isFormLoaded"
    ><slot name="actions" :submit="submit"></slot
  ></template>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
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
    // Provided by the consumer to indicate that the initial data to load the form is ready.
    isDataReady: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  setup(_props, context) {
    const { checkFormioValidity } = useFormioUtils();
    let formioForm: FormIOForm;
    const isFormLoaded = ref(false);

    const formLoaded = (form: FormIOForm) => {
      formioForm = form;
      isFormLoaded.value = true;
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

    return {
      formLoaded,
      submit,
      formRender,
      formChanged,
      formCustomEvent,
      isFormLoaded,
    };
  },
});
</script>
