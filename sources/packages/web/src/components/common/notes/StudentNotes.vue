<template>
  <body-header-container>
    <template #header>
      <body-header title="Notes" title-header-level="2">
        <template #actions>
          <v-btn-toggle
            v-model="toggleNotes"
            mandatory
            class="float-right btn-toggle"
            selected-class="selected-btn-toggle"
          >
            <v-btn
              rounded="xl"
              color="primary"
              data-cy="allNotesButton"
              @click="filterNotes()"
              value="allNotes"
              >All Notes</v-btn
            >
            <v-btn
              rounded="xl"
              v-for="item in StudentNoteType"
              :key="item"
              color="primary"
              :value="item"
              :data-cy="item"
              class="ml-2"
              @click="filterNotes(item)"
              >{{ item }}</v-btn
            >
          </v-btn-toggle>
        </template>
      </body-header>
    </template>
    <notes
      title="Past Notes"
      :entityType="NoteEntityType.Student"
      :notes="notes"
      @submitData="addNote"
      :allowedRole="Role.StudentCreateNote"
      :allowAddingNotes="allowAddingNotes"
    ></notes>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useSnackBar } from "@/composables";
import { StudentNoteType, NoteEntityType, Role, NoteItemModel } from "@/types";
import { NoteAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  components: { Notes },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    allowAddingNotes: {
      type: Boolean,
      required: false,
    },
  },
  setup(props) {
    const toggleNotes = ref("allNotes");
    const notes = ref([] as NoteItemModel[]);
    const filteredNoteType = ref({} as StudentNoteType | undefined);
    const snackBar = useSnackBar();

    const filterNotes = async (noteType?: StudentNoteType) => {
      filteredNoteType.value = noteType;
      notes.value = await NoteService.shared.getStudentNotes(
        props.studentId,
        filteredNoteType.value,
      );
    };

    const addNote = async (data: NoteAPIInDTO) => {
      try {
        await NoteService.shared.addStudentNote(props.studentId, data);
        await filterNotes(filteredNoteType.value);
        snackBar.success("The note has been added to the student.");
      } catch {
        snackBar.error("Unexpected error while adding the note.");
      }
    };

    onMounted(filterNotes);
    return {
      notes,
      StudentNoteType,
      filterNotes,
      addNote,
      NoteEntityType,
      toggleNotes,
      Role,
    };
  },
});
</script>
