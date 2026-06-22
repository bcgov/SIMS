<template>
  <v-dialog
    v-model="showHideDialog"
    :width="width"
    persistent
    :no-click-animation="true"
    scrollable
    :fullscreen="showFullScreen"
    :content-class="showFullScreen ? 'modal-dialog-fullscreen' : undefined"
  >
    <v-card
      elevation="4"
      :max-width="showFullScreen ? undefined : maxWidth"
      :min-width="showFullScreen ? undefined : minWidth"
      class="modal-height"
    >
      <v-card-title>
        <slot name="header">
          <h2
            v-if="title"
            class="category-header-large primary-color mt-2 mb-0"
          >
            {{ title }}
          </h2>
        </slot>
      </v-card-title>
      <v-divider-inset-opaque />
      <v-card-text class="px-4">
        <div class="pb-2" v-if="subTitle">{{ subTitle }}</div>
        <slot name="content">Please add the modal content here!</slot>
      </v-card-text>
      <v-divider-inset-opaque />
      <v-card-actions>
        <v-spacer></v-spacer>
        <div class="mx-2 mb-2">
          <slot name="footer"></slot>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref, watch, defineComponent, computed } from "vue";
import { useDisplay } from "vuetify";
const dialogClosedEvent = "dialogClosed";

export default defineComponent({
  emits: [dialogClosedEvent],
  props: {
    showDialog: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    maxWidth: {
      type: Number,
      required: false,
      default: 730,
    },
    minWidth: {
      type: Number,
      required: false,
      default: 730,
    },
    subTitle: {
      type: String,
      required: false,
      default: undefined,
    },
  },

  setup(props, context) {
    const showHideDialog = ref(false);
    const { smAndDown: showFullScreen } = useDisplay();
    const width = computed(() => (showFullScreen.value ? undefined : "auto"));
    watch(
      () => props.showDialog,
      (currValue: boolean) => {
        showHideDialog.value = currValue;
      },
    );
    watch(
      () => showHideDialog.value,
      () => {
        if (!showHideDialog.value) {
          // Handle events when the user clicks outside
          // the modal or press ESC to cancel it.
          context.emit(dialogClosedEvent);
        }
      },
    );

    return { showHideDialog, showFullScreen, width };
  },
});
</script>
