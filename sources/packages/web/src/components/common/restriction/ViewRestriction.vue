<template>
  <modal-dialog-base :showDialog="showDialog" @dialogClosed="dialogClosed">
    <template v-slot:content>
      <v-container class="temporary-modal">
        <formio
          formName="viewRestriction"
          :data="restrictionData"
          @loaded="formLoaded"
          @submitted="submitResolution"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Resolve Restriction"
        @primaryClick="resolveRestriction"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { RestrictionType } from "@/types";
export default {
  components: { ModalDialogBase },
  props: {
    restrictionData: {
      type: Object,
      required: true,
    },
  },
  emits: ["submitResolutionData"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const formData = ref();

    const dialogClosed = () => {
      showDialog.value = false;
    };
    const formLoaded = async (form: any) => {
      formData.value = form;
    };
    const submitForm = async () => {
      return formData.value.submit();
    };
    const submitResolution = async (data: any) => {
      context.emit("submitResolutionData", data);
    };
    const resolveRestriction = async () => {
      const formSubmitted = await submitForm();
      if (formSubmitted) {
        showDialog.value = false;
      }
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      formLoaded,
      submitResolution,
      submitForm,
      RestrictionType,
      resolveRestriction,
    };
  },
};
</script>
