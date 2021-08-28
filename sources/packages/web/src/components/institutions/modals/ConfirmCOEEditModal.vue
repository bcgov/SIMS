<template>
  <ModalBase
    title="Edit Program Information?"
    dialogType="question"
    :showDialog="showDialog"
  >
    <template v-slot:content>
      You are about to change a students program or offering information.<br />
      This will result in a new Program Information Request and a new Assessment
      for the student.<br />
      Are you sure you want to change the program or offering information?
    </template>
    <template v-slot:footer>
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
    </template>
  </ModalBase>
</template>

<script lang="ts">
import ModalBase from "@/components/generic/ModalBase.vue";
import { useModal } from "@/composables";

export default {
  components: {
    ModalBase,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModal<boolean>();

    const editProgramInfo = () => {
      showDialog.value = false;
      resolvePromise(true);
    };

    const cancelModal = () => {
      showDialog.value = false;
      resolvePromise(false);
    };

    return {
      showDialog,
      editProgramInfo,
      cancelModal,
      showModal,
    };
  },
};
</script>
