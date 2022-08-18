<template>
  <modal-dialog-base :showDialog="showDialog" @dialogClosed="dialogClosed">
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
      <check-permission-role :role="allowedRole">
        <template #="{ notAllowed }">
          <footer-buttons
            :disablePrimaryButton="notAllowed"
            primaryLabel="Add note"
            @primaryClick="addNewNote"
            @secondaryClick="dialogClosed"
          />
        </template>
      </check-permission-role>
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { PropType, ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useFormioUtils } from "@/composables";
import {
  InstitutionNoteType,
  StudentNoteType,
  NoteEntityType,
  Role,
} from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { NoteAPIInDTO } from "@/services/http/dto";

export default {
  components: { ModalDialogBase, CheckPermissionRole },
  props: {
    entityType: {
      type: String,
      required: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
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
      const options = [{}];
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
    const submitNote = async (data: NoteAPIInDTO) => {
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
      Role,
    };
  },
};
</script>
