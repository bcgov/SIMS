<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Dynamic Forms Editor" subTitle="Dynamic Forms">
        <template #buttons>
          <v-btn
            color="primary"
            variant="outlined"
            class="mr-2"
            @click="copyToClipboard"
            >Copy to clipboard</v-btn
          >
          <v-btn
            color="primary"
            variant="outlined"
            class="mr-2"
            @click="viewOnRepo"
            >View on repository</v-btn
          >
          <v-btn color="primary" @click="saveDynamicForm"
            >Save dynamic form</v-btn
          ></template
        ></header-navigator
      >
    </template>
    <v-combobox
      v-model="selectedForm"
      :items="formsListOptions"
      label="Select a dynamic form"
      item-text="title"
      item-value="name"
      :loading="formsListOptionsLoading"
      @update:modelValue="formSelected"
    ></v-combobox>
    <v-skeleton-loader
      v-if="formDefinitionLoading"
      class="mx-auto"
      type="card, paragraph, table-row@4, paragraph, actions"
      boilerplate
    ></v-skeleton-loader>
    <div v-show="!formDefinitionLoading" ref="formioBuilderRef"></div>
  </full-page-container>
  <confirm-modal
    title="Save dynamic form"
    ref="saveDynamicFormModal"
    okLabel="Save"
    cancelLabel="Cancel"
    text="Are you sure you want to save this version of the dynamic form?"
  />
</template>

<script lang="ts">
import { ModalDialog, useSnackBar } from "@/composables";
//import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { FORMIO_CUSTOM_COMPONENTS, Role } from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import ApiClient from "@/services/http/ApiClient";
import { FormAPIOutDTO } from "@/services/http/dto";
import { Formio } from "@formio/js";

export default defineComponent({
  components: {
    //CheckPermissionRole,
    ConfirmModal,
  },
  setup() {
    const snackBar = useSnackBar();
    const saveDynamicFormModal = ref({} as ModalDialog<boolean>);
    const formioBuilderRef = ref();
    const formsListOptionsLoading = ref(false);
    const formDefinitionLoading = ref(false);
    const formsListOptions = ref<FormAPIOutDTO[]>([]);
    const selectedForm = ref<FormAPIOutDTO>();
    let builder: any = undefined;

    onMounted(async () => {
      // Load the formio definitions list.
      formsListOptionsLoading.value = true;
      try {
        const list = await ApiClient.DynamicForms.getFormsList();
        formsListOptions.value = list.forms;
      } catch (error) {
        snackBar.error("Unexpected error loading forms list.");
      } finally {
        formsListOptionsLoading.value = false;
      }
      // Create the formio builder.
      builder = await Formio.builder(
        formioBuilderRef.value,
        {},
        {
          noNewEdit: true,
          noDefaultSubmitButton: true,
          alwaysConfirmComponentRemoval: true,
          builder: {
            custom: FORMIO_CUSTOM_COMPONENTS,
          },
        },
      );
    });

    /**
     * Load the select form definition.
     * @param form form to be loaded.
     */
    const formSelected = async (form: FormAPIOutDTO): Promise<void> => {
      if (!form?.name) {
        return;
      }
      formDefinitionLoading.value = true;
      try {
        const formDefinition = await ApiClient.DynamicForms.getFormDefinition(
          form.name,
        );
        builder.form = formDefinition;
      } catch {
        snackBar.error("Unexpected error loading form definition.");
      } finally {
        formDefinitionLoading.value = false;
      }
    };

    /**
     * Save the dynamic form definition removing unwanted properties.
     */
    const getReadyToSaveFormDefinition = (): string => {
      // Properties that are not required to be saved.
      const nonRequiredProperties = [
        "_id",
        "access",
        "owner",
        "created",
        "machineName",
        "modified",
        "submissionAccess",
        "pdfComponents",
      ];
      // Clone the form definition to avoid modifying the original one.
      const clonedForm = JSON.parse(JSON.stringify(builder.schema));
      // Remove non-required properties from the form definition.
      nonRequiredProperties.forEach((property) => {
        delete clonedForm[property];
      });
      return clonedForm;
    };

    const saveDynamicForm = async (): Promise<void> => {
      if (selectedForm.value?.name === undefined) {
        snackBar.warn("Please select a form to save.");
        return;
      }
      const shouldContinue = await saveDynamicFormModal.value.showModal();
      if (!shouldContinue) {
        return;
      }
      await ApiClient.DynamicForms.updateForm(selectedForm.value.name, {
        formDefinition: getReadyToSaveFormDefinition(),
      });
    };

    const copyToClipboard = async (): Promise<void> => {
      try {
        const formDefinition = JSON.stringify(
          getReadyToSaveFormDefinition(),
          null,
          2,
        );
        await navigator.clipboard.writeText(formDefinition);
        snackBar.success("Form definition copied to clipboard.");
      } catch {
        snackBar.error("Error copying form definition to clipboard.");
      }
    };

    const viewOnRepo = async (): Promise<void> => {
      if (selectedForm.value === undefined) {
        snackBar.warn("Please select a form.");
        return;
      }
      const url = `https://github.dev/bcgov/SIMS/blob/main/sources/packages/forms/src/form-definitions/${selectedForm.value.name.toLowerCase()}.json`;
      window.open(url, "_blank");
    };

    return {
      Role,
      saveDynamicFormModal,
      formioBuilderRef,
      formsListOptions,
      selectedForm,
      formsListOptionsLoading,
      formDefinitionLoading,
      formSelected,
      saveDynamicForm,
      copyToClipboard,
      viewOnRepo,
    };
  },
});
</script>
