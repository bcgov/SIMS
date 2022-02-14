<template>
  <ProgressSpinner v-if="!hideSpinner" />
  <div ref="formioContainerRef"></div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { Formio } from "formiojs";
import { SetupContext } from "vue";
import ApiClient from "../../services/http/ApiClient";
import FormUploadService from "../../services/FormUploadService";
import { FormIOCustomEvent } from "@/types";

export default {
  emits: ["submitted", "loaded", "changed", "customEvent"],
  props: {
    formName: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
    },
    readOnly: {
      type: Boolean,
    },
  },
  setup(props: any, context: SetupContext) {
    const formioContainerRef = ref(null);
    // Wait to show the spinner when there is an API call.
    const hideSpinner = ref(true);
    let form: any;

    // Update the form submission data and triggers the form redraw.
    // Redrawing ensures that components like dropdowns are going to
    // display the correct label associated with the correct value
    // that was loaded into the sumission data.
    const updateFormSubmissionData = () => {
      if (form && props.data) {
        form.submission = {
          data: props.data,
        };
        form.redraw();
      }
    };

    onMounted(async () => {
      let cachedFormDefinition: string | null = null;
      // Avoid caching during development to allow that the changes
      // on form.io definitions have effect immediately.
      if (process.env.NODE_ENV !== "development") {
        try {
          // Try to load the definition from the session storage.
          cachedFormDefinition = sessionStorage.getItem(props.formName);
        } catch {
          // No action needed. In case of failure it will load the form from the server
          // in the same way as it is the first time load.
        }
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
        {
          fileService: new FormUploadService(),
          readOnly: props.readOnly,
        },
      );

      form.nosubmit = true;
      hideSpinner.value = true;
      updateFormSubmissionData();

      context.emit("loaded", form);

      // Triggered when any component in the form is changed.
      form.on("change", (event: any) => {
        context.emit("changed", form, event);
      });

      form.on("submit", (submision: any) => {
        context.emit("submitted", submision.data, form);
      });

      form.on("customEvent", (event: FormIOCustomEvent) => {
        context.emit("customEvent", form, event);
      });
    });

    watch(
      () => props.data,
      () => {
        updateFormSubmissionData();
      },
      { deep: true },
    );

    watch(
      () => props.readOnly,
      () => {
        if (form) {
          form.options.readOnly = props.readOnly;
          form.redraw();
        }
      },
    );

    return { formioContainerRef, hideSpinner };
  },
};
</script>

<style lang="scss"></style>
