<template>
  <full-page-container :full-width="true">
    <v-row class="m-2">
      <v-col class="category-header-large color-blue">{{ title }}</v-col>
      <v-col
        ><v-btn
          @click="addNewNote()"
          class="float-right"
          color="primary"
          prepend-icon="fa:far fa-edit"
        >
          Create new note</v-btn
        ></v-col
      >
    </v-row>
    <v-row class="m-2" v-if="!notes || notes.length === 0"
      ><v-col
        >No notes found. Please click on create new note to add one.</v-col
      ></v-row
    >
    <v-timeline
      truncate-line="both"
      side="end"
      align="left"
      class="justify-content-start"
    >
      <v-timeline-item
        v-for="note in notes"
        :key="note"
        dot-color="primary"
        size="x-small"
        fill-dot
      >
        <div class="d-flex">
          <span class="primary-color marker-text">{{
            dateOnlyLongString(note.createdAt)
          }}</span>
          <div class="mx-8">
            <div class="content-header">{{ note.noteType }}</div>
            <div v-if="showMoreNotes(notes)" class="header mt-2">
              {{ note.description.substring(0, 150) }}
              <a @click="toggleNotes(notes)" class="primary-color"
                >Show more...</a
              >
            </div>
            <div v-else class="header mt-2">
              {{ note.description }}
              <a
                v-if="note.showMore"
                @click="toggleNotes(notes)"
                class="primary-color"
                >Show less...</a
              >
            </div>
            <div class="content-footer mt-2 mb-8 secondary-color-light">
              <span>{{ timeOnlyInHoursAndMinutes(note.createdAt) }}</span
              ><span class="mx-2">|</span>
              <span>{{ `${note.lastName}, ${note.firstName}` }}</span>
            </div>
          </div>
        </div>
      </v-timeline-item>
    </v-timeline>
    <CreateNoteModal
      ref="createNotesModal"
      :entityType="entityType"
      @submitData="emitToParent"
    />
  </full-page-container>
</template>

<script lang="ts">
import { useFormatters, ModalDialog } from "@/composables";
import CreateNoteModal from "@/components/common/notes/CreateNoteModal.vue";
import { NoteBaseDTO, NoteDTO, LayoutTemplates } from "@/types";
import { ref } from "vue";
import "@/assets/css/notes.scss";

export default {
  components: { CreateNoteModal },
  props: {
    notes: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
  },
  emits: ["submitData"],
  setup(props: any, context: any) {
    const { dateOnlyLongString, timeOnlyInHoursAndMinutes } = useFormatters();
    const showModal = ref(false);
    const createNotesModal = ref({} as ModalDialog<void>);
    const addNewNote = async () => {
      await createNotesModal.value.showModal();
    };
    const emitToParent = async (data: NoteBaseDTO) => {
      context.emit("submitData", data);
    };

    const toggleNotes = (item: NoteDTO) => {
      item.showMore = !item.showMore;
    };

    const showMoreNotes = (item: NoteDTO) => {
      return (
        item.description && item.description.length > 150 && !item.showMore
      );
    };

    return {
      dateOnlyLongString,
      timeOnlyInHoursAndMinutes,
      addNewNote,
      createNotesModal,
      showModal,
      emitToParent,
      toggleNotes,
      showMoreNotes,
      LayoutTemplates,
    };
  },
};
</script>
