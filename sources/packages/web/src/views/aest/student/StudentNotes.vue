<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <v-row class="mb-2 mt-2">
        <v-col cols="3" class="category-header-large">Notes</v-col>
        <v-col class="text-center">
          <div class="float-right">
            <v-row>
              <v-col>
                <v-btn
                  rounded
                  variant="tonal"
                  :class="{ 'primary-btn-background': !filteredNoteType }"
                  data-cy="allNotesButton"
                  @click="filterNotes()"
                  >All Notes</v-btn
                >
              </v-col>
              <v-col v-for="item in StudentNoteType" :key="item">
                <v-btn
                  rounded
                  variant="tonal"
                  :class="{
                    'primary-btn-background': filteredNoteType === item,
                  }"
                  data-cy="noteTypeItem"
                  @click="filterNotes(item)"
                  >{{ item }}</v-btn
                >
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
      <content-group>
        <Notes
          title="Past Notes"
          :entityType="NoteEntityType.Student"
          :notes="notes"
          @submitData="addNote"
        ></Notes>
      </content-group>
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useFormatters, useSnackBar } from "@/composables";
import { StudentNoteType, NoteBaseDTO, NoteEntityType } from "@/types";
import useEmitter from "@/composables/useEmitter";

export default {
  components: { Notes },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const emitter = useEmitter();
    const notes = ref();
    const filteredNoteType = ref();
    const { dateOnlyLongString } = useFormatters();
    const toast = useSnackBar();

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
        emitter.emit(
          "snackBar",
          toast.success("The note has been added to the student."),
        );
      } catch (error) {
        emitter.emit(
          "snackBar",
          toast.error("Unexpected error while adding the note."),
        );
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
    };
  },
};
</script>
