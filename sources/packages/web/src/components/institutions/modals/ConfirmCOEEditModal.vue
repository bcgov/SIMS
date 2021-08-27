<template>
  <v-dialog v-model="dialogModel">
    <v-card>
      <v-card-title class="text-h5">
        <v-icon class="mr-2" size="45" color="blue"
          >mdi-comment-question</v-icon
        >
        Edit Program Information?
      </v-card-title>
      <v-card-text>
        You are about to change a students program or offering information.<br />
        This will result in a new Program Information Request and a new
        Assessment for the student.<br />
        Are you sure you want to change the program or offering information?
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" outlined @click="cancelModal">
          Cancel
        </v-btn>
        <v-btn
          color="danger"
          depressed
          @click="editProgramInfo"
          style="color:white"
        >
          <v-icon left size="25">
            mdi-pencil
          </v-icon>
          Edit Program Information
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref } from "vue";

export default {
  setup() {
    const dialogModel = ref(false);
    let resolvePromise: (value: boolean) => void;

    const showModal = async (): Promise<boolean> => {
      dialogModel.value = true;
      return new Promise(resolve => {
        resolvePromise = resolve;
      });
    };

    const editProgramInfo = () => {
      dialogModel.value = false;
      resolvePromise(true);
    };

    const cancelModal = () => {
      dialogModel.value = false;
      resolvePromise(false);
    };

    return {
      dialogModel,
      editProgramInfo,
      cancelModal,
      showModal,
    };
  },
};
</script>
