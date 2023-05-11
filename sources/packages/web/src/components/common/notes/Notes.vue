<template>
  <body-header-container>
    <v-row class="m-2">
      <v-col class="category-header-large color-blue">{{ title }}</v-col>
      <v-col v-if="allowAddingNotes">
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <v-btn
              @click="addNewNote"
              class="float-right"
              color="primary"
              prepend-icon="fa:far fa-edit"
              :disabled="notAllowed"
            >
              Create new note
            </v-btn>
          </template>
        </check-permission-role>
      </v-col>
    </v-row>
    <v-row class="m-2" v-if="!notes || notes.length === 0"
      ><v-col
        >No notes found. Please click on create new note to add one.</v-col
      ></v-row
    >
    <v-timeline
      side="end"
      align="start"
      class="justify-content-start"
      truncate-line="both"
    >
      <v-timeline-item
        v-for="note in notes"
        :key="note"
        dot-color="primary"
        size="x-small"
        fill-dot
      >
        <div class="d-flex">
          <span class="primary-color label-bold">{{
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
    <create-note-modal
      ref="createNotesModal"
      :entityType="entityType"
      :allowedRole="allowedRole"
    />
  </body-header-container>
</template>

<script lang="ts">
import { useFormatters, ModalDialog } from "@/composables";
import CreateNoteModal from "@/components/common/notes/CreateNoteModal.vue";
import { LayoutTemplates, NoteItemModel, Role } from "@/types";
import { PropType, ref, defineComponent } from "vue";
import "@/assets/css/notes.scss";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { NoteAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  components: { CreateNoteModal, CheckPermissionRole },
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
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
    allowAddingNotes: {
      type: Boolean,
      required: false,
    },
  },
  emits: ["submitData"],
  setup(_props, context) {
    const { dateOnlyLongString, timeOnlyInHoursAndMinutes } = useFormatters();
    const showModal = ref(false);
    const createNotesModal = ref({} as ModalDialog<NoteAPIInDTO | boolean>);
    const addNewNote = async () => {
      const addNewNoteData = await createNotesModal.value.showModal();
      if (addNewNoteData) {
        context.emit("submitData", addNewNoteData);
      }
    };

    const toggleNotes = (item: NoteItemModel) => {
      item.showMore = !item.showMore;
    };

    const showMoreNotes = (item: NoteItemModel) => {
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
      toggleNotes,
      showMoreNotes,
      LayoutTemplates,
      Role,
    };
  },
});
</script>
