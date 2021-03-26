<template>
  <ProgressSpinner v-if="!hideSpinner" />
  <div ref="formioContainerRef"></div>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { Formio } from "formiojs";
import { SetupContext } from "vue";
import ApiClient from "../../services/http/ApiClient";

export default {
  emits: ["submitted", "loaded"],
  props: {
    formName: {
      type: String,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const formioContainerRef = ref(null);
    const hideSpinner = ref(false);

    onMounted(async () => {
      // Use SIMS API as a proxy to retrieve the form definition from formio.
      const formDefinition = await ApiClient.DynamicForms.getFormDefinition(
        props.formName,
      );

      const form = await Formio.createForm(
        formioContainerRef.value,
        formDefinition.data,
      );
      form.nosubmit = true;
      hideSpinner.value = true;
      context.emit("loaded", form);
      form.on("submit", (submision: any) => {
        context.emit("submitted", submision.data);
      });
    });

    return { formioContainerRef, hideSpinner };
  },
};
</script>

<style lang="scss"></style>
