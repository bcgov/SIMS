<template>
  <ModalDialogBase :title="title" :showDialog="showDialog">
    <template v-slot:content>
      <formio
        :formName="formName"
        :data="formData"
        @loaded="formLoaded"
      ></formio>
    </template>
    <template v-slot:footer>
      <slot name="actions" :cancel="cancel" :submit="submit"></slot>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useFormioUtils, useModalDialog } from "@/composables";
import { FormIOForm } from "@/types";
import formio from "@/components/generic/formio.vue";

export default {
  components: {
    formio,
    ModalDialogBase,
  },
  props: {
    title: { type: String, required: true },
    formName: { type: String, required: true },
    formData: { type: Object, required: false },
  },
  setup() {
    const { checkFormioValidity } = useFormioUtils();
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      FormIOForm | boolean
    >();
    let form: FormIOForm;

    const formLoaded = (loadedForm: FormIOForm) => {
      form = loadedForm;
    };

    const submit = () => {
      if (checkFormioValidity([form])) {
        resolvePromise(form);
      }
    };

    const cancel = () => {
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      formLoaded,
      submit,
      cancel,
    };
  },
};
</script>
