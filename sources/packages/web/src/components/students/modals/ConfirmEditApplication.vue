<template>
  <ModalDialogBase
    title="Confirm Edit Application"
    dialogType="question"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <v-container class="p-component text-dark">
        <p>
          This will result in a new assessment which could cause a delay in your
          application, are you sure you want to proceed?
        </p>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-row>
        <v-col>
          <v-btn color="primary" variant="outlined" @click="dialogClosed">
            No
          </v-btn>
        </v-col>
        <v-col>
          <v-btn
            color="warning"
            depressed
            class="text-white"
            @click="editApplication"
          >
            <v-icon left size="25"> mdi-cancel </v-icon>
            Yes
          </v-btn>
        </v-col>
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

    const dialogClosed = () => {
      resolvePromise(false);
    };
    const editApplication = async () => {
      resolvePromise(true);
    };
    return {
      showDialog,
      showModal,
      dialogClosed,
      editApplication,
    };
  },
};
</script>
