<template>
  <SINStatusBanner
    v-if="sinValidity.sinStatus !== SinStatusEnum.VALID"
    :message="sinValidity.message"
    :severity="sinValidity.severity"
  />
</template>

<script lang="ts">
import { useStore } from "vuex";
import SINStatusBanner from "@/views/student/SINStatusBanner.vue";

import {
  PENDING_SIN_MESSAGE,
  INVALID_SIN_MESSAGE,
} from "@/constants/message-constants";
import { SinStatusEnum } from "@/types";

export default {
  components: { SINStatusBanner },
  props: {},
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
