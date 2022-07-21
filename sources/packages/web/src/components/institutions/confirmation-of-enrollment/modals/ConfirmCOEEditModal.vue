<template>
  <ModalDialogBase
    title="Edit Program Information?"
    dialogType="question"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      You are about to change a students program or offering information.<br />
      This will result in a new Program Information Request and a new Assessment
      for the student.<br />
      Are you sure you want to change the program or offering information?
    </template>
    <template v-slot:footer>
      <v-row class="m-0 p-0">
        <v-btn color="primary" variant="outlined" @click="dialogClosed">
          Cancel
        </v-btn>
        <v-btn
          color="danger"
          depressed
          @click="editProgramInfo"
          style="color: white"
        >
          <v-icon left size="25"> mdi-pencil </v-icon>
          Edit Program Information
        </v-btn>
      </v-row>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";

export default {
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();

    const editProgramInfo = () => {
      showDialog.value = false;
      resolvePromise(true);
    };

    const dialogClosed = () => {
      showDialog.value = false;
      resolvePromise(false);
    };

    return {
      showDialog,
      editProgramInfo,
      showModal,
      dialogClosed,
    };
  },
};
</script>
