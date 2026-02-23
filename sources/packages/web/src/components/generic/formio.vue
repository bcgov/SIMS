<template>
  <div v-show="!isFormReady || loading">
    <slot name="loading"
      ><v-skeleton-loader type="image, article"></v-skeleton-loader
    ></slot>
  </div>
  <div
    v-show="isFormReady && !loading"
    class="ff-form-container"
    ref="formioContainerRef"
  ></div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { Formio } from "@formio/js";
import ApiClient from "@/services/http/ApiClient";
import FormUploadService from "@/services/FormUploadService";
import {
  FormIOChangeEvent,
  FormIOComponent,
  FormIOCustomEvent,
  FormIOForm,
} from "@/types";
import { v4 as uuid } from "uuid";
import {
  useFormatters,
  useFormioUtils,
  useOffering,
  useAssessment,
} from "@/composables";
import { FORMIO_LOAD_DATA_PROCESSING_VIEW_DELAY } from "@/constants/system-constants";

export default defineComponent({
  emits: {
    submitted: (submission: unknown, form: FormIOForm) => {
      return !!submission && !!form;
    },
    changed: (form: FormIOForm, event: FormIOChangeEvent) => {
      return !!form && !!event;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loaded: (form: FormIOForm, _formKey: string | number) => {
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
      default: undefined,
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
    // Allow an alternative control of the loading state, overriding the isDataReady behavior.
    // Useful when the form must be loaded into the DOM to allow form.io utils methods to interact
    // with the form but the form can still be displayed in its loading state for the user.
    loading: {
      type: Boolean,
      default: false,
      required: false,
    },
    formKey: {
      type: [String, Number],
      default: null,
      required: false,
    },
  },
  setup(props, context) {
    const { registerUtilsMethod, createCacheIdentifier } = useFormioUtils();
    const { currencyFormatter, isLessThanGivenWeeks } = useFormatters();
    const { mapOfferingIntensity } = useOffering();
    const { mapLivingCategory, mapStudentDependantStatus } = useAssessment();
    // Register global utils functions.
    registerUtilsMethod("currencyFormatter", currencyFormatter);
    registerUtilsMethod("mapOfferingIntensity", mapOfferingIntensity);
    registerUtilsMethod("mapLivingCategory", mapLivingCategory);
    registerUtilsMethod("mapStudentDependantStatus", mapStudentDependantStatus);
    registerUtilsMethod("isLessThanGivenWeeks", isLessThanGivenWeeks);
    let formDefinition: FormIOComponent;
    const formioContainerRef = ref(null);
    // Indicates if the form definition is loaded.
    const isFormDefinitionLoaded = ref(false);
    // Indicates if the form is created.
    const isFormCreated = ref(false);
    // Unless the form is created and the data is ready, the loader is displayed.
    const isFormReady = computed(
      () => isFormCreated.value && props.isDataReady,
    );
    let createFormInProgress = false;
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
      isFormDefinitionLoaded.value = true;
    };

    const createForm = async () => {
      try {
        createFormInProgress = true;
        form = await Formio.createForm(
          formioContainerRef.value,
          formDefinition,
          {
            fileService: new FormUploadService(),
            readOnly: props.readOnly,
          },
        );
        updateFormSubmissionData();
        form.nosubmit = true;

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

        // When the form submission data is set, the form is rendered again.
        // To visually hide the form until the rendering to be completed, a delay is set.
        setTimeout(() => {
          isFormCreated.value = true;
          context.emit("loaded", form, props.formKey);
        }, FORMIO_LOAD_DATA_PROCESSING_VIEW_DELAY);
      } finally {
        createFormInProgress = false;
      }
    };

    watchEffect(async () => {
      if (props.formName) {
        if (!isFormDefinitionLoaded.value) {
          await loadFormDefinition(props.formName);
        }
        // Form definition is expected to be loaded at this point.
        if (
          props.isDataReady &&
          !isFormCreated.value &&
          !createFormInProgress
        ) {
          await createForm();
        }
      }
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
