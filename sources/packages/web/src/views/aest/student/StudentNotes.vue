<template>
  <full-page-container
    :layout-template="LayoutTemplates.Centered"
    :full-width="true"
  >
    <v-row class="my-2 pl-0">
      <v-col cols="3" class="category-header-large">Notes</v-col>
      <v-col>
        <v-btn-toggle
          v-model="toggleNotes"
          mandatory
          class="float-right btn-toggle"
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
      </v-col>
    </v-row>
    <notes
      title="Past Notes"
      :entityType="NoteEntityType.Student"
      :notes="notes"
      @submitData="addNote"
      :allowedRole="Role.StudentCreateNote"
    ></notes>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useFormatters, useSnackBar } from "@/composables";
import {
  StudentNoteType,
  NoteEntityType,
  LayoutTemplates,
  Role,
} from "@/types";
import { NoteAPIInDTO } from "@/services/http/dto";

export default {
  components: { Notes },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const toggleNotes = ref("allNotes");
    const notes = ref();
    const filteredNoteType = ref();
    const { dateOnlyLongString } = useFormatters();
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
      } catch (error) {
        snackBar.error("Unexpected error while adding the note.");
      }
    };

    onMounted(async () => {
      await filterNotes();
    });
    return {
      notes,
      dateOnlyLongString,
      StudentNoteType,
      filterNotes,
      filteredNoteType,
      addNote,
      NoteEntityType,
      LayoutTemplates,
      toggleNotes,
      Role,
    };
  },
};
</script>
