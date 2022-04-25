<template>
  <ProgressSpinner v-if="!hideSpinner" />
  <div class="ff-form-container" ref="formioContainerRef"></div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { Formio } from "formiojs";
import { SetupContext } from "vue";
import ApiClient from "@/services/http/ApiClient";
import FormUploadService from "@/services/FormUploadService";
import { FormIOCustomEvent, formIOHeader } from "@/types";
import { v4 as uuid } from "uuid";
import { DynamicFormsService } from "@/services/DynamicFormsService";

export default {
  emits: ["submitted", "loaded", "changed", "customEvent", "render"],
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
  },
  setup(props: any, context: SetupContext) {
    const formioContainerRef = ref(null);
    // Wait to show the spinner when there is an API call.
    const hideSpinner = ref(true);
    let form: any;

    // Get projectUrl and authorization to render nested forms.
    const [projectUrl, authorization] =
      DynamicFormsService.shared.formIOUrlAndBearerToken();

    // Set projectUrl for nested forms.
    Formio.setProjectUrl(projectUrl);

    // Set authorization for projectUrl for nested forms.
    Formio.plugins = [
      {
        priority: 0,
        requestOptions: function (value: formIOHeader) {
          value.headers.Authorization = authorization;
          return value;
        },
      },
    ];

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

      // In a scenario where the same form definition must be rendered twice on the same page
      // the form can be defined as 'scoped' to have its elements IDs uniquely identified
      // to avoid issues with HTML features that rely on the unique IDs.
      if (props.scoped) {
        const uniqueId = uuid();
        const createUniqueIDs = (parentComponent: any) => {
          if (parentComponent.components) {
            parentComponent.components.forEach((childComponent: any) => {
              childComponent.id = `${childComponent.id}${uniqueId}`;
              createUniqueIDs(childComponent);
            });
          }
        };
        createUniqueIDs(formDefinition.data);
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
      { deep: true },
    );

    return { formioContainerRef, hideSpinner };
  },
};
</script>
