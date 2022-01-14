<template>
  <Message
    v-if="sinValidity.sinStatus !== SinStatusEnum.VALID"
    :severity="sinValidity.severity"
  >
    {{ sinValidity.message }}
  </Message>
</template>

<script lang="ts">
import { useStore } from "vuex";

import {
  PENDING_SIN_MESSAGE,
  INVALID_SIN_MESSAGE,
} from "@/constants/message-constants";
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
      if (store.state.student.validSIN === false) {
        return {
          sinStatus: SinStatusEnum.INVALID,
          severity: "error",
          message: INVALID_SIN_MESSAGE,
        };
      } else if (store.state.student.validSIN === null) {
        return {
          sinStatus: SinStatusEnum.PENDING,
          severity: "warn",
          message: PENDING_SIN_MESSAGE,
        };
      }
      return {
        sinStatus: SinStatusEnum.VALID,
        severity: "",
        message: "",
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
