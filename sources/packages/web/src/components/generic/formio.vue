<template>
  <div v-show="!isFormReady">
    <slot name="loading"
      ><v-skeleton-loader type="image, article"></v-skeleton-loader></slot
    >"
  </div>
  <div
    v-show="isFormReady"
    class="ff-form-container"
    ref="formioContainerRef"
  ></div>
</template>

<script lang="ts">
import { computed, onMounted, ref, watch } from "vue";
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
import { useFormatters, useFormioUtils, useOffering } from "@/composables";

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
      default: true,
      required: false,
    },
    // Provided by the consumer to indicate that the initial data to load the form is ready.
    isDataReady: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  setup(props, context) {
    const { registerUtilsMethod, createCacheIdentifier } = useFormioUtils();
    const { currencyFormatter } = useFormatters();
    const { mapOfferingIntensity } = useOffering();
    // Register global utils functions.
    registerUtilsMethod("currencyFormatter", currencyFormatter);
    registerUtilsMethod("mapOfferingIntensity", mapOfferingIntensity);
    let formDefinition: FormIOComponent;

    const formioContainerRef = ref(null);
    // Indicates if the form is created.
    const isFormCreated = ref(false);
    // Unless the form is created and the data is ready, the loader is displayed.
    const isFormReady = computed(
      () => isFormCreated.value && props.isDataReady,
    );
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

    const loadFormDefinition = async (formName: string) => {
      const cachedFormName = await createCacheIdentifier(formName);
      let cachedFormDefinition: string | null = null;
      // Avoid caching during development to allow that the changes
      // on form.io definitions have effect immediately.
      if (!import.meta.env.DEV) {
        try {
          // Try to load the definition from the session storage.
          cachedFormDefinition = sessionStorage.getItem(cachedFormName);
        } catch {
          // No action needed. In case of failure it will load the form from the server
          // in the same way as it is the first time load.
        }
      }

      if (cachedFormDefinition) {
        formDefinition = JSON.parse(cachedFormDefinition);
      } else {
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
    };

    const createForm = async () => {
      form = await Formio.createForm(formioContainerRef.value, formDefinition, {
        fileService: new FormUploadService(),
        readOnly: props.readOnly,
        submission: {
          data: props.data ?? {},
        },
      });

      form.nosubmit = true;
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
      isFormCreated.value = true;
    };

    onMounted(async () => {
      await loadFormDefinition(props.formName);
      await createForm();
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

    return { formioContainerRef, isFormReady };
  },
});
</script>
