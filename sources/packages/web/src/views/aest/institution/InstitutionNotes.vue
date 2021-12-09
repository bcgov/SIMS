<template>
  <v-row class="mb-2">
    <v-col cols="3" class="category-header-large">Notes</v-col>
    <v-col class="text-center">
      <div class="float-right">
        <Button
          label="All Notes"
          class="p-button-rounded mr-2 button-not-selected"
          :class="{ 'button-selected': !filteredNoteType }"
          @click="filterNotes()"
        />
        <Button
          v-for="item in InstitutionNoteType"
          :key="item"
          :label="item"
          class="p-button-rounded mr-2 button-not-selected"
          :class="{ 'button-selected': filteredNoteType === item }"
          @click="filterNotes(item)"
        />
      </div>
    </v-col>
  </v-row>
  <content-group>
    <Notes title="Past Notes" :notes="notes"></Notes>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import Notes from "@/components/common/notes/Notes.vue";
import { NoteService } from "@/services/NoteService";
import { useFormatters } from "@/composables";
import { InstitutionNoteType } from "@/types/contracts/NoteContract";

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
    const { dateOnlyLongString, timeOnlyString } = useFormatters();

    const filterNotes = async (noteType?: InstitutionNoteType) => {
      filteredNoteType.value = noteType ? noteType : "";
      notes.value = await NoteService.shared.getInstitutionNotes(
        props.institutionId,
        filteredNoteType.value,
      );
    };

    onMounted(async () => {
      await filterNotes();
    });
    return {
      notes,
      dateOnlyLongString,
      timeOnlyString,
      InstitutionNoteType,
      filterNotes,
      filteredNoteType,
    };
  },
};
</script>
<style lang="scss">
.button-not-selected {
  background: #8692a4;
  color: #ffffff;
  max-height: 30px;
}
.button-selected {
  background: #2965c5;
  color: #ffffff;
  max-height: 30px;
}
.p-button:enabled:focus {
  background: #2965c5;
}
</style>
