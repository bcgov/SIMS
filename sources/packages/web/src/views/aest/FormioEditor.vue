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
    const formioBuilderRef = ref(null);

    onMounted(async () => {
      const shadowRoot = formioBuilderRef.value.attachShadow({ mode: "open" });
      const css1 = document.createElement("link");
      css1.rel = "stylesheet";
      css1.href =
        "https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css";
      shadowRoot.appendChild(css1);

      const css2 = document.createElement("link");
      css2.rel = "stylesheet";
      css2.href =
        "https://cdn.jsdelivr.net/npm/bootstrap/dist/css/bootstrap.min.css";
      shadowRoot.appendChild(css2);

      const css3 = document.createElement("link");
      css3.rel = "stylesheet";
      css3.href = "https://cdn.form.io/js/formio.full.min.css";
      shadowRoot.appendChild(css3);

      const js1 = document.createElement("script");
      js1.src = "https://cdn.form.io/js/formio.full.min.js";
      js1.onload = async () => {
        const formioBuilder = shadowRoot.getElementById("formioBuilder");
        if (formioBuilder) {
          Formio.setProjectUrl("sims");
          const formDefinition = await ApiClient.DynamicForms.getFormDefinition(
            "sfaa2025-26-pt",
          );
          await Formio.builder(formioBuilder, formDefinition);
        } else {
          console.error("Form builder container not found in shadow DOM.");
        }
      };
      shadowRoot.appendChild(js1);

      const formioBuilder = document.createElement("div");
      formioBuilder.id = "formioBuilder";
      shadowRoot.appendChild(formioBuilder);
    });

    return {
      Role,
      saveDynamicFormModal,
      formioBuilderRef,
    };
  },
});
</script>
