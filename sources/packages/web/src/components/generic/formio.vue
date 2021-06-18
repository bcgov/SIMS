<template>
  <ProgressSpinner v-if="!hideSpinner" />
  <div ref="formioContainerRef"></div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { Formio } from "formiojs";
import { SetupContext } from "vue";
import ApiClient from "../../services/http/ApiClient";
import { prop } from "vue-class-component";

export default {
  emits: ["submitted", "loaded", "changed"],
  props: {
    formName: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
    },
  },
  setup(props: any, context: SetupContext) {
    const formioContainerRef = ref(null);
    // Wait to show the spinner when there is an API call.
    const hideSpinner = ref(true);
    let form: any;

    onMounted(async () => {
      let cachedFormDefinition: string | null = null;
      try {
        // Try to load the definition from the session storage.
        cachedFormDefinition = sessionStorage.getItem(props.formName);
      } catch {
        // No action needed. In case of failure it will load the form from the server
        // in the same way as it is the first time load.
      }

      let formDefinition: any;
      if (cachedFormDefinition) {
        formDefinition = JSON.parse(cachedFormDefinition);
      } else {
        hideSpinner.value = false;
        // Use SIMS API as a proxy to retrieve the form definition from formio.
        formDefinition = await ApiClient.DynamicForms.getFormDefinition(
          props.formName,
        );

        try {
          sessionStorage.setItem(
            props.formName,
            JSON.stringify(formDefinition),
          );
        } catch {
          // No action needed. In case of failure it will load the form from the server
          // in the same way as it is the first time load.
        }
      }

      form = await Formio.createForm(
        formioContainerRef.value,
        formDefinition.data,
      );

      form.nosubmit = true;
      hideSpinner.value = true;
      if (props.data) {
        form.submission = {
          data: props.data,
        };
      }

      context.emit("loaded", form);

      // Triggered when any component in the form is changed.
      form.on("change", (event: any) => {
        context.emit("changed", form, event);
      });

      form.on("submit", (submision: any) => {
        context.emit("submitted", submision.data);
      });
    });

    watch(
      () => props.data,
      () => {
        if (form && props.data) {
          form.submission = {
            data: props.data,
          };
        }
      },
    );

    return { formioContainerRef, hideSpinner };
  },
};
</script>

<style lang="scss"></style>
