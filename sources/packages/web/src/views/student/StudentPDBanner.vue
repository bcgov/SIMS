<template>
  <Message
    severity="warn"
    :closable="false"
    v-if="pdStatus === StudentPDStatus.Pending"
  >
    <strong>PD Status: Pending</strong>
  </Message>
  <Message
    severity="success"
    :closable="false"
    v-if="pdStatus === StudentPDStatus.Yes"
  >
    <strong>PD Status: PD Confirmed</strong>
  </Message>
  <Message
    severity="error"
    :closable="false"
    v-if="pdStatus === StudentPDStatus.No"
  >
    <strong>PD Status: PD Denied</strong>
  </Message>
</template>
<script lang="ts">
import { StudentPDStatus } from "@/types";
export default {
  props: {
    pdStatus: {
      type: String,
    },
  },
  setup() {
    return {
      StudentPDStatus,
    };
  },
};
</script>
