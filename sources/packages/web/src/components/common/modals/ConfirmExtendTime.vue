<template>
  <ModalDialogBase
    title="Confirm Extend Time"
    dialogType="warning"
    :showDialog="showDialog"
    @click="extendTime"
  >
    <template v-slot:content>
      <v-container class="p-component text-dark">
        <p>
          You are about to be logged off, do you wish to extend your time?
          <v-btn class="ml-2 text-white" color="warning" icon>
            {{ countdown }}
          </v-btn>
        </p>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" variant="outlined" @click="dialogClosed">
        No
      </v-btn>
      <v-btn color="warning" depressed class="text-white" @click="extendTime">
        <v-icon left size="25"> mdi-clock </v-icon>
        Yes
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useAuth } from "@/composables";
import { COUNT_DOWN_TIMER_FOR_LOGOUT } from "@/constants/system-constants";
import { ref, watch } from "vue";
import { ClientIdType } from "@/types/contracts/ConfigContract";

export default {
  components: {
    ModalDialogBase,
  },
  props: {
    clientIdType: {
      type: String,
      required: true,
      default: "" as ClientIdType,
    },
  },
  setup(props: any) {
    const countdown = ref(COUNT_DOWN_TIMER_FOR_LOGOUT);
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const interval = ref();
    const { executeLogout } = useAuth();

    const logoff = async () => {
      await executeLogout(props.clientIdType);
    };

    const dialogClosed = () => {
      clearInterval(interval.value);
      logoff();
      resolvePromise(false);
    };

    const updateTimer = () => {
      if (countdown.value > 0) {
        countdown.value--;
      } else {
        dialogClosed();
      }
    };

    const initializeCounter = () => {
      countdown.value = COUNT_DOWN_TIMER_FOR_LOGOUT;
    };

    const countDownTimer = () => {
      clearInterval(interval.value);
      initializeCounter();
      // * Set timer for 1 second, every 1 second updateTimer will be called.
      interval.value = setInterval(updateTimer, 1000);
    };

    const extendTime = async () => {
      clearInterval(interval.value);
      resolvePromise(true);
      initializeCounter();
    };

    watch(
      () => showDialog.value,
      (currValue: boolean) => {
        if (currValue) {
          countDownTimer();
        } else {
          clearInterval(interval.value);
        }
      },
    );

    return {
      showDialog,
      showModal,
      dialogClosed,
      extendTime,
      countdown,
    };
  },
};
</script>
