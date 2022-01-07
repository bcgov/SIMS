<template>
  <ModalDialogBase :showDialog="showDialog" @dialogClosed="dialogClosed">
    <template v-slot:content>
      <v-container class="restriction-modal">
        <formio
          formName="viewRestriction"
          :data="institutionRestriction"
          @loaded="formLoaded"
          @submitted="submitResolution"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> Cancel </v-btn>
      <v-btn
        v-if="
          institutionRestriction.isActive &&
            institutionRestriction.restrictionType ===
              RestrictionType.Provincial
        "
        @click="resolveRestriction()"
        class="float-right primary-btn-background"
      >
        Resolve Restriction
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import { ref } from "vue";
import formio from "@/components/generic/formio.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { RestrictionType } from "@/types";
export default {
  components: { ModalDialogBase, formio },
  props: {
    institutionRestriction: {
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
