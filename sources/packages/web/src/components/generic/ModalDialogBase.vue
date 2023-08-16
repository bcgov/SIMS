<template>
  <v-dialog
    v-model="showHideDialog"
    persistent
    :no-click-animation="true"
    scrollable
  >
    <!-- TODO remove mx-auto in stable version of vuetify to center modelDialog -->
    <v-card
      elevation="10"
      :max-width="maxWidth"
      :min-width="minWidth"
      class="modal-height mx-auto"
    >
      <v-card-title>
        <slot name="header">
          <h2 v-if="title" class="category-header-large primary-color">
            {{ title }}
          </h2>
        </slot>
      </v-card-title>
      <hr class="mx-6 mt-1 mb-9 horizontal-divider" />
      <v-card-text class="pt-0">
        <div class="pb-2" v-if="subTitle">{{ subTitle }}</div>
        <slot name="content">Please add the modal content here!</slot>
      </v-card-text>
      <hr class="mx-6 mt-0 horizontal-divider" />
      <v-card-actions>
        <v-spacer></v-spacer>
        <div class="mx-4 mb-2">
          <slot name="footer"></slot>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
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
    },
  },
  setup(props, context) {
    const showHideDialog = ref(false);
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

    return { showHideDialog };
  },
});
</script>
