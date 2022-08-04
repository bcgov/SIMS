<template>
  <v-dialog
    v-model="showHideDialog"
    persistent
    :no-click-animation="true"
    scrollable
  >
    <v-card elevation="10" :max-width="maxWidth">
      <v-card-header>
        <v-card-title>
          <slot name="header">
            <h2 v-if="title" class="category-header-large primary-color">
              {{ title }}
            </h2>
          </slot>
        </v-card-title>
      </v-card-header>
      <v-divider class="mx-6 mt-1 mb-4"></v-divider>
      <v-card-text class="pt-0 max-dialog-height">
        <div class="pb-2" v-if="subTitle">{{ subTitle }}</div>
        <slot name="content">Please add the modal content here!</slot>
      </v-card-text>
      <v-divider class="mx-6 mt-1 mb-0"></v-divider>
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
import { ref, watch, computed, SetupContext } from "vue";

const dialogClosedEvent = "dialogClosed";

enum DialogTypes {
  info = "info",
  question = "question",
  warning = "warning",
}

export default {
  props: {
    showDialog: {
      type: Boolean,
      required: true,
    },
    dialogType: {
      type: String,
      required: true,
      validator: (val: string) => val in DialogTypes,
    },
    title: {
      type: String,
      required: true,
    },
    maxWidth: {
      type: Number,
      required: false,
    },
    subTitle: {
      type: String,
      required: false,
    },
  },
  emits: [dialogClosedEvent],
  setup(props: any, context: SetupContext) {
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

    const icon = computed(() => {
      switch (props.dialogType) {
        case DialogTypes.info:
          return "mdi-information-outline";
        case DialogTypes.question:
          return "mdi-comment-question-outline";
        case DialogTypes.warning:
          return "mdi-alert-outline";
        default:
          return null;
      }
    });

    return { showHideDialog, icon };
  },
};
</script>
<style scoped>
.max-dialog-height {
  /* Set the max-height to 65% of the viewport to allow scrollable content. */
  max-height: 65vh;
}
</style>
