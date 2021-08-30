<template>
  <v-dialog v-model="showHideDialog">
    <v-card elevation="10">
      <v-card-header>
        <v-card-title class="text-h5">
          <slot name="header">
            <v-icon class="mr-2" size="45">{{ icon }}</v-icon>
            {{ title }}
          </slot>
        </v-card-title>
      </v-card-header>
      <v-card-text>
        <slot name="content">Please add the modal content here!</slot>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="footer"></slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref, watch, computed } from "vue";

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
  },
  setup(props: any) {
    const showHideDialog = ref(false);
    watch(
      () => props.showDialog,
      (currValue: boolean) => {
        showHideDialog.value = currValue;
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
          return "";
      }
    });

    return { showHideDialog, icon };
  },
};
</script>
