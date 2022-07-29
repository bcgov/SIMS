<template>
  <v-container>
    <v-row class="my-2 pl-0">
      <v-col cols="3" class="category-header-large">Notes</v-col>
      <v-col class="text-center">
        <div class="float-right">
          <v-row>
            <v-col>
              <v-btn
                rounded
                :color="!filteredNoteType ? 'primary' : 'secondary'"
                data-cy="allNotesButton"
                @click="filterNotes()"
                >All Notes</v-btn
              >
            </v-col>
            <v-col v-for="item in StudentNoteType" :key="item">
              <v-btn
                rounded
                :color="filteredNoteType === item ? 'primary' : 'secondary'"
                data-cy="noteTypeItem"
                @click="filterNotes(item)"
                >{{ item }}</v-btn
              >
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
    <full-page-container
      :layout-template="LayoutTemplates.CenteredCard"
      :full-width="true"
    >
      <notes
        title="Past Notes"
        :entityType="NoteEntityType.Student"
        :notes="notes"
        @submitData="addNote"
      ></notes>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useFormatters, useSnackBar } from "@/composables";
import {
  StudentNoteType,
  NoteBaseDTO,
  NoteEntityType,
  LayoutTemplates,
} from "@/types";

export default {
  components: { Notes },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
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

    const addNote = async (data: NoteBaseDTO) => {
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
    };
  },
};
</script>
