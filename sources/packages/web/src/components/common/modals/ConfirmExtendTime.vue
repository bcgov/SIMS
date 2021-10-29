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
          You are about to logged off, do you wish to extend your time?
          <v-btn class="ml-2 text-white" color="warning" icon>
            {{ countDown }}
          </v-btn>
        </p>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> No </v-btn>
      <v-btn color="warning" depressed class="text-white" @click="extendTime">
        <v-icon left size="25"> mdi-cancel </v-icon>
        Yes
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useAuth, useClientLoader } from "@/composables";
import { COUNT_DOWN_TIMER_FOR_LOGOUT } from "@/constants/system-constants";
import { ref, onUnmounted, watch } from "vue";
import { ClientIdType } from "@/types/contracts/ConfigContract";

export default {
  components: {
    ModalDialogBase,
  },
  props: {
    startTimer: {
      type: Boolean,
      required: false,
    },
    clientIdType: {
      type: String,
      required: true,
      default: "" as ClientIdType,
    },
  },
  setup(props: any) {
    const countDown = ref(COUNT_DOWN_TIMER_FOR_LOGOUT);
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const interval = ref();
    const { executeLogout } = useAuth();
    const { getClientType } = useClientLoader();

    const logoff = async () => {
      await executeLogout(getClientType(props.clientIdType));
    };

    const dialogClosed = () => {
      showDialog.value = false;
      clearInterval(interval.value);
      logoff();
    };

    const updateTimer = () => {
      if (countDown.value > 0) {
        countDown.value -= 1;
      } else {
        dialogClosed();
      }
    };

    const initializeCounter = () => {
      countDown.value = COUNT_DOWN_TIMER_FOR_LOGOUT;
    };

    const countDownTimer = () => {
      initializeCounter();
      // * Set timer for 1 second, every 1 second updateTimer will be called.
      interval.value = setInterval(updateTimer, 1000);
    };

    const extendTime = async () => {
      clearInterval(interval.value);
      showDialog.value = false;
      resolvePromise(true);
      initializeCounter();
    };

    onUnmounted(() => {
      clearInterval(interval.value);
    });

    watch(
      () => props.startTimer,
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
      countDown,
    };
  },
};
</script>
