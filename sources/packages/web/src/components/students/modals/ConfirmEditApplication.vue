<template>
  <ModalDialogBase
    title="Confirmation Edit Applcation"
    dialogType="question"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <v-container>
        <p>
          This will result in a new assessment which could cause a delay in your
          application, are you sure you want to proceed?
        </p>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> No </v-btn>
      <v-btn
        color="warning"
        depressed
        @click="editApplication"
        style="color: white"
      >
        <v-icon left size="25"> mdi-cancel </v-icon>
        Yes
      </v-btn>
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
  props: {
    applicationId: {
      type: Number,
      required: false,
    },
  },
  emits: ["confirmEditApplication"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const dialogClosed = () => {
      showDialog.value = false;
    };
    const editApplication = async () => {
      if (props.applicationId) {
        context.emit("confirmEditApplication", props.applicationId);
      } else {
        context.emit("confirmEditApplication");
      }
      dialogClosed();
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
