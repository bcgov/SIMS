<template>
  <ModalDialogBase :showDialog="showDialog" @dialogClosed="dialogClosed">
    <template v-slot:content>
      <v-container class="min-width-modal">
        <formio
          formName="createnote"
          @loaded="formLoaded"
          @submitted="submitNote"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> Cancel </v-btn>
      <v-btn @click="addNewNote()" class="float-right primary-btn-background">
        Add note
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import { ref } from "vue";
import formio from "@/components/generic/formio.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { NoteBaseDTO } from "@/types";
export default {
  components: { ModalDialogBase, formio },
  emits: ["submitData"],
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
    const submitNote = async (data: NoteBaseDTO) => {
      context.emit("submitData", data);
    };
    const addNewNote = async () => {
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
      submitNote,
      addNewNote,
    };
  },
};
</script>
