<template>
  <v-row>
    <v-col cols="3" class="category-header-large mb-2">Notes</v-col>
    <v-col class="text-center">
      <div class="float-right">
        <!-- Prime vue button used here as Vuetify alpha version is not supporting rounded buttons.
             TODO: when moving to vuetify change the button component to v-btn of vuetify -->
        <Button
          label="All Notes"
          class="p-button-rounded mr-2 mb-2 secondary-btn-background-lt filter-button"
          :class="{ 'primary-btn-background': !filteredNoteType }"
          @click="filterNotes()"
        />
        <Button
          v-for="item in InstitutionNoteType"
          :key="item"
          :label="item"
          class="p-button-rounded mr-2 mb-2 secondary-btn-background-lt filter-button"
          :class="{ 'primary-btn-background': filteredNoteType === item }"
          @click="filterNotes(item)"
        />
      </div>
    </v-col>
  </v-row>
  <content-group>
    <Notes title="Past Notes" :notes="notes" @submitData="addNote"></Notes>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useFormatters, useToastMessage } from "@/composables";
import { InstitutionNoteType, NoteBaseDTO } from "@/types";

export default {
  components: { ContentGroup, Notes },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const notes = ref();
    const filteredNoteType = ref("");
    const { dateOnlyLongString } = useFormatters();
    const toast = useToastMessage();

    const filterNotes = async (noteType?: InstitutionNoteType | string) => {
      filteredNoteType.value = noteType ? noteType : "";
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
    };
  },
};
</script>
<style lang="scss">
.filter-button {
  max-height: 30px;
}
</style>
