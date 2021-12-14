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
import { useModalDialog, useFormioUtils } from "@/composables";
import {
  NoteBaseDTO,
  InstitutionNoteType,
  StudentNoteType,
  NoteEntityType,
} from "@/types";
export default {
  components: { ModalDialogBase, formio },
  props: {
    entityType: {
      type: String,
      required: true,
    },
  },
  emits: ["submitData"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const formData = ref();
    const formioUtils = useFormioUtils();
    const dialogClosed = () => {
      showDialog.value = false;
    };
    const formLoaded = async (form: any) => {
      formData.value = form;
      const dropdown = formioUtils.getComponent(form, "noteType");
      const options = [];
      if (props.entityType === NoteEntityType.Institution) {
        for (const noteType in InstitutionNoteType) {
          options.push({ label: noteType, value: noteType });
        }
      }
      if (props.entityType === NoteEntityType.Student) {
        for (const noteType in StudentNoteType) {
          options.push({ label: noteType, value: noteType });
        }
      }
      dropdown.component.data.values = options;
      dropdown.redraw();
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
