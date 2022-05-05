<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <v-row class="mb-2 mt-2">
        <v-col cols="3" class="category-header-large">Notes</v-col>
        <v-col class="text-center">
          <div class="float-right">
            <!-- Prime vue button used here as Vuetify alpha version is not supporting rounded buttons.
             TODO: when moving to vuetify change the button component to v-btn of vuetify -->
            <Button
              label="All Notes"
              class="p-button-rounded mr-2 secondary-btn-background-lt filter-button"
              :class="{ 'primary-btn-background': !filteredNoteType }"
              data-cy="allNotes"
              @click="filterNotes()"
            />
            <Button
              v-for="item in StudentNoteType"
              :key="item"
              :label="item"
              class="p-button-rounded mr-2 secondary-btn-background-lt filter-button"
              :class="{ 'primary-btn-background': filteredNoteType === item }"
              data-cy="item"
              @click="filterNotes(item)"
            />
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
import ContentGroup from "@/components/generic/ContentGroup.vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useFormatters, useToastMessage } from "@/composables";
import { StudentNoteType, NoteBaseDTO, NoteEntityType } from "@/types";

export default {
  components: { ContentGroup, Notes },
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
    const toast = useToastMessage();

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
        toast.success(
          "Note added successfully",
          "The note has been added to the student.",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while adding the note.",
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
