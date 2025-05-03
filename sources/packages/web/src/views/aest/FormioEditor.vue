<template>
  <full-page-container :full-width="true">
    <template #header
      ><header-navigator
        title="Dynamic Forms Editor"
        subTitle="Dynamic Forms"
      />
    </template>
    <div ref="formioBuilderRef"></div>
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
import { Formio } from "@formio/js";
import { defineComponent, onMounted, ref } from "vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import ApiClient from "@/services/http/ApiClient";

export default defineComponent({
  components: {
    //CheckPermissionRole,
    ConfirmModal,
  },
  setup() {
    const snackBar = useSnackBar();
    const saveDynamicFormModal = ref({} as ModalDialog<boolean>);
    const formioBuilderRef = ref();

    onMounted(async () => {
      const formDefinition = await ApiClient.DynamicForms.getFormDefinition(
        "sfaa2025-26-pt",
      );
      await Formio.builder(formioBuilderRef.value, formDefinition);
    });

    return {
      Role,
      saveDynamicFormModal,
      formioBuilderRef,
    };
  },
});
</script>
