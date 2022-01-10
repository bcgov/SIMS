<template>
  <SINStatusBanner
    v-if="sinStatus !== 1"
    :message="message"
    :severity="severity"
  />
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import SINStatusBanner from "@/views/student/SINStatusBanner.vue";

import {
  PENDING_SIN_MESSAGE,
  INVALID_SIN_MESSAGE,
} from "@/constants/message-constants";

export default {
  components: { SINStatusBanner },
  props: {},
  setup(props: any) {
    const store = useStore();
    const message = ref("");
    const sinStatus = ref(1);
    const severity = ref("");

    const checkValidSIN = () => {
      const isValidSIN = store.state.student.validSIN;
      if (isValidSIN === false) {
        sinStatus.value = 3;
        message.value = INVALID_SIN_MESSAGE;
        severity.value = "error";
      } else if (isValidSIN === null) {
        sinStatus.value = 2;
        message.value = PENDING_SIN_MESSAGE;
        severity.value = "warn";
      }
    };

    onMounted(async () => {
      checkValidSIN();
    });

    return {
      sinStatus,
      message,
      severity,
    };
  },
};
</script>
