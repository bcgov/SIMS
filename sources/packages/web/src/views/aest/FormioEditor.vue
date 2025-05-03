<template>
  <full-page-container :full-width="true">
    <template #header
      ><header-navigator
        title="Dynamic Forms Editor"
        subTitle="Dynamic Forms"
      />
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
import { Role } from "@/types";
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

    onMounted(async () => {
      formsListOptionsLoading.value = true;
      const list = await ApiClient.DynamicForms.getFormsList();
      formsListOptions.value = list.forms;
      console.log(list.forms);
      formsListOptionsLoading.value = false;
    });

    const formSelected = async (form: FormAPIOutDTO): Promise<void> => {
      formDefinitionLoading.value = true;
      const formDefinition = await ApiClient.DynamicForms.getFormDefinition(
        form.name,
      );
      await Formio.builder(formioBuilderRef.value, formDefinition);
      formDefinitionLoading.value = false;
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
    };
  },
});
</script>
