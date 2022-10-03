<template>
  <v-form ref="addNewNoteForm">
    <modal-dialog-base
      title="Create new note"
      :showDialog="showDialog"
      max-width="730"
    >
      <template #content>
        <error-summary :errors="addNewNoteForm.errors" />
        <div class="pb-2">
          <span class="label-value"
            >Add a note with relavent decisions or actions taken on this
            account.</span
          >
        </div>
        <v-autocomplete
          label="Note type"
          density="compact"
          :items="noteTypeItems"
          v-model="formModel.noteType"
          variant="outlined"
          placeholder="Select a Note type"
          :rules="[(v) => !!v || 'Note type is required.']" />
        <v-textarea
          hide-details
          label="Note body"
          placeholder="Long text..."
          v-model="formModel.description"
          variant="outlined"
          :rules="[(v) => !!v || 'Note body is required']"
      /></template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              justify="end"
              primaryLabel="Add note"
              @secondaryClick="cancel"
              @primaryClick="submit"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { PropType, ref, reactive, onMounted } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog } from "@/composables";
import {
  Role,
  VForm,
  InstitutionNoteType,
  StudentNoteType,
  NoteEntityType,
} from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { NoteAPIInDTO, NoteTypeItemsDTO } from "@/services/http/dto";

export default {
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
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

  setup(props: any) {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      NoteAPIInDTO | boolean
    >();
    const addNewNoteForm = ref({} as VForm);
    const formModel = reactive({} as NoteAPIInDTO);
    const noteTypeItems = ref([] as NoteTypeItemsDTO[]);

    onMounted(async () => {
      if (props.entityType === NoteEntityType.Institution) {
        for (const noteType in InstitutionNoteType) {
          noteTypeItems.value.push({ title: noteType, value: noteType });
        }
      }
      if (props.entityType === NoteEntityType.Student) {
        for (const noteType in StudentNoteType) {
          noteTypeItems.value.push({ title: noteType, value: noteType });
        }
      }
    });

    const submit = async () => {
      const validationResult = await addNewNoteForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload = { ...formModel };
      resolvePromise(payload);
      addNewNoteForm.value.reset();
    };

    const cancel = () => {
      addNewNoteForm.value.reset();
      addNewNoteForm.value.resetValidation();
      resolvePromise(false);
    };
    return {
      showDialog,
      showModal,
      formModel,
      Role,
      submit,
      cancel,
      addNewNoteForm,
      noteTypeItems,
    };
  },
};
</script>
