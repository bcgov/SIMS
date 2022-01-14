<template>
  <Message
    v-if="sinValidity.sinStatus !== SinStatusEnum.VALID"
    :severity="sinValidity.severity"
  >
    {{ sinValidity?.message }}
  </Message>
</template>

<script lang="ts">
import { useStore } from "vuex";

import { SinStatusEnum } from "@/types";

export default {
  props: {
    message: {
      type: String,
    },
    severity: {
      type: String,
    },
  },
  computed: {
    sinValidity() {
      const store = useStore();
      return {
        sinStatus: store.state.student.sinValidStatus.sinStatus,
        severity: store.state.student.sinValidStatus.severity,
        message: store.state.student.sinValidStatus.message,
      };
    },
  },
  setup() {
    return {
      SinStatusEnum,
    };
  },
};
</script>
