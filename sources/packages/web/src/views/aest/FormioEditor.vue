<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Dynamic Forms Editor" subTitle="Dynamic Forms" />
    </template>
    <body-header-container>
      <template #header>
        <body-header title="Editor">
          <template #actions>
            <v-btn
              color="primary"
              @click="saveDynamicForm"
              class="mr-2 float-right"
              :loading="saveDynamicFormLoading"
              prepend-icon="fa:fa fa-save"
              :disabled="!selectedForm"
              >Save</v-btn
            >
            <v-btn
              color="primary"
              @click="downloadFile"
              class="mr-2 float-right"
              prepend-icon="fa:fa fa-download"
              :disabled="!selectedForm"
              >Download</v-btn
            >
            <v-btn
              color="primary"
              prepend-icon="fa:fa fa-copy"
              class="mr-2 float-right"
              @click="copyToClipboard"
              :disabled="!selectedForm"
              >Copy</v-btn
            >
            <v-btn
              color="primary"
              prepend-icon="fa:fa-brands fa-github"
              class="mr-2 float-right"
              @click="viewOnRepo"
              :disabled="!selectedForm"
              >Repo</v-btn
            >
            <v-autocomplete
              v-model="selectedForm"
              :items="formsListOptions"
              label="Select a dynamic form"
              item-text="title"
              item-value="path"
              :clearable="true"
              :loading="formsListOptionsLoading"
              :disabled="formsListOptionsLoading"
              :return-object="true"
              variant="outlined"
              density="compact"
              class="mr-2 float-right"
              width="400"
              hide-details="auto"
              @update:modelValue="formSelected"
            ></v-autocomplete>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!selectedForm"
          message="Please select a dynamic form to be edited."
        >
          <v-skeleton-loader
            v-if="formDefinitionLoading"
            class="mx-auto"
            type="card, paragraph, table-row@4, paragraph, actions"
            boilerplate
          ></v-skeleton-loader>
          <div v-show="!formDefinitionLoading" ref="formioBuilderRef"></div>
          <v-expansion-panels class="mt-4">
            <v-expansion-panel
              collapse-icon="$expanderCollapseIcon"
              expand-icon="$expanderExpandIcon"
            >
              <v-expansion-panel-title>
                <v-icon icon="mdi-code-json"></v-icon
                ><span
                  data-cy="locationName"
                  class="category-header-medium mx-1"
                  >Form definition inspector</span
                >
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <content-group>
                  <v-textarea v-model="formDefinition" rows="20"></v-textarea>
                  <footer-buttons
                    primaryLabel="Apply form definition to editor"
                    @primaryClick="applyDynamicFormDefinition"
                    :showSecondaryButton="false"
                    justify="end"
                    class="mr-1"
                  />
                </content-group>
              </v-expansion-panel-text> </v-expansion-panel
          ></v-expansion-panels>
        </toggle-content>
      </content-group>
    </body-header-container>
  </full-page-container>
  <confirm-modal
    title="Save dynamic form"
    ref="saveDynamicFormModal"
    okLabel="Save"
    cancelLabel="Cancel"
    text="Are you sure you want to save this version of the dynamic form?"
  />
  <confirm-modal
    title="Apply dynamic form definition"
    ref="applyDynamicFormDefinitionModal"
    okLabel="Apply"
    cancelLabel="Cancel"
    text="Are you sure you want to override the current form definition in the editor by the new one provided here?"
  />
</template>

<script lang="ts">
import {
  ModalDialog,
  useFileUtils,
  useFormioUtils,
  useSnackBar,
} from "@/composables";
import { FORMIO_CUSTOM_COMPONENTS, FormIOBuilder, Role } from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import ApiClient from "@/services/http/ApiClient";
import { FormAPIOutDTO } from "@/services/http/dto";
import { Formio } from "@formio/js";

export default defineComponent({
  components: {
    ConfirmModal,
  },
  setup() {
    const snackBar = useSnackBar();
    const { getReadyToSaveFormDefinition, getFormattedFormDefinition } =
      useFormioUtils();
    const saveDynamicFormModal = ref({} as ModalDialog<boolean>);
    const applyDynamicFormDefinitionModal = ref({} as ModalDialog<boolean>);
    const formioBuilderRef = ref();
    const formsListOptionsLoading = ref(false);
    const formDefinitionLoading = ref(false);
    const saveDynamicFormLoading = ref(false);
    const formsListOptions = ref<FormAPIOutDTO[]>([]);
    const selectedForm = ref<FormAPIOutDTO>();
    let builder: FormIOBuilder;
    const formDefinition = ref<string>("");
    const { generateJSONFileFromContent } = useFileUtils();

    onMounted(async () => {
      // Load the formio definitions list.
      formsListOptionsLoading.value = true;
      try {
        const list = await ApiClient.DynamicForms.getFormsList();
        formsListOptions.value = list.forms;
      } catch {
        snackBar.error("Unexpected error loading forms list.");
      } finally {
        formsListOptionsLoading.value = false;
      }
    });

    /**
     * Load the select form definition.
     * @param form form to be loaded.
     */
    const formSelected = async (form: FormAPIOutDTO): Promise<void> => {
      if (!form?.path) {
        return;
      }
      formDefinitionLoading.value = true;
      try {
        const definition = await ApiClient.DynamicForms.getFormDefinition(
          form.path,
        );
        // Recreate the formio builder.
        builder = await Formio.builder(formioBuilderRef.value, definition, {
          noNewEdit: true,
          noDefaultSubmitButton: true,
          alwaysConfirmComponentRemoval: true,
          builder: {
            custom: FORMIO_CUSTOM_COMPONENTS,
          },
        });
        updateFormDefinitionInspector();
        builder?.on("change", () => {
          updateFormDefinitionInspector();
        });
      } catch {
        snackBar.error("Unexpected error loading form definition.");
      } finally {
        formDefinitionLoading.value = false;
      }
    };

    /**
     * Update the form definition inspector with the current form definition.
     */
    const updateFormDefinitionInspector = async (): Promise<void> => {
      formDefinition.value = getFormattedFormDefinition(builder.schema);
    };

    /**
     * Persists the change to the dynamic form definition database.
     */
    const saveDynamicForm = async (): Promise<void> => {
      if (selectedForm.value?.path === undefined) {
        snackBar.warn("Please select a form to save.");
        return;
      }
      const shouldContinue = await saveDynamicFormModal.value.showModal();
      if (!shouldContinue) {
        return;
      }
      try {
        saveDynamicFormLoading.value = true;
        await ApiClient.DynamicForms.updateForm(selectedForm.value.path, {
          formDefinition: getReadyToSaveFormDefinition(builder.schema),
        });
        snackBar.success("Form definition saved.");
      } catch {
        snackBar.error("Unexpected error saving form definition.");
      } finally {
        saveDynamicFormLoading.value = false;
      }
    };

    /**
     * Copy the form definition to the clipboard.
     */
    const copyToClipboard = async (): Promise<void> => {
      try {
        const formDefinition = getFormattedFormDefinition(builder.schema);
        await navigator.clipboard.writeText(formDefinition);
        snackBar.success("Form definition copied to clipboard.");
      } catch {
        snackBar.error("Error copying form definition to clipboard.");
      }
    };

    /**
     * Open the form definition in the GitHub repository.
     */
    const viewOnRepo = async (): Promise<void> => {
      window.open(
        `https://github.dev/bcgov/SIMS/blob/main/sources/packages/forms/src/form-definitions/${selectedForm.value?.path.toLowerCase()}.json`,
        "_blank",
        "noopener,noreferrer",
      );
    };

    /**
     * Apply the dynamic form definition to the builder.
     */
    const applyDynamicFormDefinition = async (): Promise<void> => {
      const apply = await applyDynamicFormDefinitionModal.value.showModal();
      if (!apply) {
        return;
      }
      builder.form = JSON.parse(formDefinition.value);
      snackBar.success(
        "Editor updated with the content from the definition inspector.",
      );
    };

    /**
     * Download the form definition as a JSON file.
     */
    const downloadFile = (): void => {
      const fileContent = getFormattedFormDefinition(builder.schema);
      const fileName = `${selectedForm.value?.path.toLowerCase()}.json`;
      generateJSONFileFromContent(fileContent, fileName);
    };

    return {
      Role,
      saveDynamicFormModal,
      applyDynamicFormDefinitionModal,
      applyDynamicFormDefinition,
      formioBuilderRef,
      formsListOptions,
      selectedForm,
      formsListOptionsLoading,
      formDefinitionLoading,
      saveDynamicFormLoading,
      formSelected,
      saveDynamicForm,
      copyToClipboard,
      viewOnRepo,
      downloadFile,
      formDefinition,
    };
  },
});
</script>
