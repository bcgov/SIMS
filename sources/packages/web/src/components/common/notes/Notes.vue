<template>
  <v-row class="m-2">
    <v-col class="category-header-medium color-blue">{{ title }}</v-col>
    <v-col
      ><v-btn @click="addNewNote()" class="float-right primary-btn-background">
        <v-icon left dark size="25"> mdi-open-in-new </v-icon>Create new
        note</v-btn
      ></v-col
    >
  </v-row>
  <v-row class="m-2" v-if="!notes || notes.length === 0"
    ><v-col
      >No notes found. Please click on create new note to add one.</v-col
    ></v-row
  >
  <!-- Prime vue timeline used here as Vuetify alpha version is not supporting timeline. 
             TODO: when moving to vuetify change the timeline component to vuetify -->
  <Timeline :value="notes">
    <template #content="slotProps">
      <v-row>
        <v-col cols="2" class="primary-color marker-text">{{
          dateOnlyLongString(slotProps.item.createdAt)
        }}</v-col>
        <v-col>
          <div class="content-header">{{ slotProps.item.noteType }}</div>
          <div v-if="showMoreNotes(slotProps.item)" class="header mt-2">
            {{ slotProps.item.description.substring(0, 150) }}
            <a @click="toggleNotes(slotProps.item)" class="primary-color"
              >Show more...</a
            >
          </div>
          <div v-else class="header mt-2">
            {{ slotProps.item.description }}
            <a
              v-if="slotProps.item.showMore"
              @click="toggleNotes(slotProps.item)"
              class="primary-color"
              >Show less...</a
            >
          </div>
          <div class="content-footer mt-2 mb-8 secondary-color-light">
            <span>{{
              timeOnlyInHoursAndMinutes(slotProps.item.createdAt)
            }}</span>
            <span class="ml-6">{{
              `${slotProps.item.lastName}, ${slotProps.item.firstName}`
            }}</span>
          </div>
        </v-col>
      </v-row>
    </template>
  </Timeline>
  <CreateNoteModal
    ref="createNotesModal"
    :entityType="entityType"
    @submitData="emitToParent"
  />
</template>

<script lang="ts">
import { useFormatters, ModalDialog } from "@/composables";
import CreateNoteModal from "@/components/common/notes/CreateNoteModal.vue";
import { NoteBaseDTO, NoteDTO } from "@/types";
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
    };
  },
};
</script>
