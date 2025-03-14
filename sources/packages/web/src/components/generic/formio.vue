<template>
  <div class="text-center p-m-4" v-if="!hideSpinner">
    <span class="label-bold muted-content-strong text-center"> Loading </span>
    <v-progress-linear
      indeterminate
      color="primary"
      rounded
      class="mt-3"
    ></v-progress-linear>
  </div>
  <div class="ff-form-container" ref="formioContainerRef"></div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { Formio } from "@formio/js";
import { defineComponent } from "vue";
import ApiClient from "@/services/http/ApiClient";
import FormUploadService from "@/services/FormUploadService";
import {
  FormIOChangeEvent,
  FormIOComponent,
  FormIOCustomEvent,
  FormIOForm,
} from "@/types";
import { v4 as uuid } from "uuid";
import { AppConfigService } from "@/services/AppConfigService";

export default defineComponent({
  emits: {
    submitted: (submission: unknown, form: FormIOForm) => {
      return !!submission && !!form;
    },
    changed: (form: FormIOForm, event: FormIOChangeEvent) => {
      return !!form && !!event;
    },
    loaded: (form: FormIOForm) => {
      return !!form;
    },
    customEvent: (form: FormIOForm, event: FormIOCustomEvent) => {
      return !!form && !!event;
    },
    render: (form: FormIOForm, event: HTMLElement) => {
      return !!form && !!event;
    },
  },
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
    scoped: {
      type: Boolean,
      default: false,
      required: false,
    },
    customUtils: {
      type: Object,
      required: false,
    },
  },
  setup(props, context) {
    const formioContainerRef = ref(null);
    // Wait to show the spinner when there is an API call.
    const hideSpinner = ref(true);
    let form: FormIOForm;

    // Update the form submission data and triggers the form redraw.
    // Redrawing ensures that components like dropdowns are going to
    // display the correct label associated with the correct value
    // that was loaded into the submission data.
    const updateFormSubmissionData = () => {
      if (form && props.data) {
        form.submission = {
          data: props.data,
        };
        form.redraw();
      }
    };

    onMounted(async () => {
      const { version } = await AppConfigService.shared.config();
      const cachedFormName = `${props.formName}-${version}`;

      let cachedFormDefinition: string | null = null;
      // Avoid caching during development to allow that the changes
      // on form.io definitions have effect immediately.
      if (process.env.NODE_ENV !== "development") {
        try {
          // Try to load the definition from the session storage.
          cachedFormDefinition = sessionStorage.getItem(cachedFormName);
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
            cachedFormName,
            JSON.stringify(formDefinition),
          );
        } catch {
          // No action needed. In case of failure it will load the form from the server
          // in the same way as it is the first time load.
        }
      }

      // In a scenario where the same form definition must be rendered twice on the same page
      // the form can be defined as 'scoped' to have its elements IDs uniquely identified
      // to avoid issues with HTML features that rely on the unique IDs.
      if (props.scoped) {
        const uniqueId = uuid();
        const createUniqueIDs = (parentComponent: FormIOComponent) => {
          if (parentComponent.components) {
            parentComponent.components.forEach((childComponent) => {
              childComponent.id = `${childComponent.id}${uniqueId}`;
              createUniqueIDs(childComponent);
            });
          }
        };
        createUniqueIDs(formDefinition);
      }

      // Adds custom utils to the utils object of the form.
      Formio.Utils.custom = props.customUtils;

      form = await Formio.createForm(formioContainerRef.value, formDefinition, {
        fileService: new FormUploadService(),
        readOnly: props.readOnly,
      });

      form.nosubmit = true;
      hideSpinner.value = true;
      updateFormSubmissionData();

      context.emit("loaded", form);

      // Triggered when any component in the form is changed.
      form.on("change", (event: FormIOChangeEvent) => {
        context.emit("changed", form, event);
      });

      form.on("submit", (submission: any) => {
        context.emit("submitted", submission.data, form);
      });

      form.on("customEvent", (event: FormIOCustomEvent) => {
        context.emit("customEvent", form, event);
      });

      // The form is done rendering and has completed the attach phase.
      // Happens, for instance, after the form has the 'redraw' method
      // executed, for instance, after data property is changed.
      form.on("render", (event: HTMLElement) => {
        context.emit("render", form, event);
      });
    });

    watch(
      () => props.data,
      () => {
        updateFormSubmissionData();
      },
    );

    watch(
      () => props.readOnly,
      () => {
        if (form) {
          form.options.readOnly = props.readOnly;
          form.redraw();
        }
      },
      { deep: true },
    );

    return { formioContainerRef, hideSpinner };
  },
});
</script>
