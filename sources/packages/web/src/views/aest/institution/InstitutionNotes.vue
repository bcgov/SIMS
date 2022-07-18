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
              <v-col v-for="item in InstitutionNoteType" :key="item">
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
          :entityType="NoteEntityType.Institution"
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
import { useFormatters, useToastMessage } from "@/composables";
import { InstitutionNoteType, NoteBaseDTO, NoteEntityType } from "@/types";

export default {
  components: { Notes },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const notes = ref();
    const filteredNoteType = ref();
    const { dateOnlyLongString } = useFormatters();
    const toast = useToastMessage();

    const filterNotes = async (noteType?: InstitutionNoteType) => {
      filteredNoteType.value = noteType;
      notes.value = await NoteService.shared.getInstitutionNotes(
        props.institutionId,
        filteredNoteType.value,
      );
    };

    const addNote = async (data: NoteBaseDTO) => {
      try {
        await NoteService.shared.addInstitutionNote(props.institutionId, data);
        await filterNotes(filteredNoteType.value);
        toast.success(
          "Note added successfully",
          "The note has been added to the institution.",
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
      InstitutionNoteType,
      filterNotes,
      filteredNoteType,
      addNote,
      NoteEntityType,
    };
  },
};
</script>
