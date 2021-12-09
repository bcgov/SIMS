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
  <Timeline :value="notes">
    <template #content="slotProps">
      <v-row>
        <v-col cols="2" class="primary-color marker-text">{{
          dateOnlyLongString(slotProps.item.createdAt)
        }}</v-col>
        <v-col>
          <div class="content-header">{{ slotProps.item.noteType }}</div>
          <div class="header mt-2">{{ slotProps.item.description }}</div>
          <div class="content-footer mt-2 mb-8 secondary-color-light">
            <span>{{ timeOnlyString(slotProps.item.createdAt) }}</span>
            <span class="ml-6">{{
              `${slotProps.item.lastName}, ${slotProps.item.firstName}`
            }}</span>
          </div>
        </v-col>
      </v-row>
    </template>
  </Timeline>
  <CreateNoteModal ref="createNotesModal" @submitData="emitToParent" />
</template>

<script lang="ts">
import { useFormatters, ModalDialog } from "@/composables";
import CreateNoteModal from "@/components/common/notes/CreateNoteModal.vue";
import { ref } from "vue";
export default {
  components: { CreateNoteModal },
  props: {
    notes: {
      type: Array,
      required: true,
    },
    title: {
      type: Array,
      required: true,
    },
  },
  emits: ["submitData"],
  setup(props: any, context: any) {
    const { dateOnlyLongString, timeOnlyString } = useFormatters();
    const showModal = ref(false);
    const createNotesModal = ref({} as ModalDialog<void>);
    const addNewNote = async () => {
      await createNotesModal.value.showModal();
    };
    const emitToParent = async (data: NoteDTO) => {
      context.emit("submitData", data);
    };
    return {
      dateOnlyLongString,
      timeOnlyString,
      addNewNote,
      createNotesModal,
      showModal,
      emitToParent,
    };
  },
};
</script>
<style lang="scss">
.p-timeline-event-marker {
  background-color: #2965c5 !important;
}

.content-header {
  color: #333a47;
  font-weight: 700;
  font-size: 17px;
  line-height: 22px;
  font-style: normal;
}

.content-body {
  color: #333a47;
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  font-style: normal;
}

.content-footer {
  color: #333a47;
  font-weight: 400;
  font-size: 14px;
  line-height: 21px;
  font-style: normal;
}
div.p-timeline-event-opposite {
  max-width: 0 !important;
}

.marker-text {
  font-weight: 700;
  font-size: 17px;
  line-height: 22px;
  font-style: normal;
}

.p-timeline .p-timeline-event-connector {
  background-color: #e8e8e8;
}
</style>
