<template>
  <v-chip :color="chipColor" variant="outlined" :class="chipBackground"
    ><v-icon :color="iconColor" :icon="icon" />
    <span class="mx-1" :class="textColor" v-if="!!label"> {{ label }}</span>
  </v-chip>
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { DisbursementScheduleStatus } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: Object as PropType<DisbursementScheduleStatus>,
      required: true,
    },
  },
  setup(props) {
    const chipColor = computed(() => {
      switch (props.status) {
        case DisbursementScheduleStatus.Sent:
          return "success";
        case DisbursementScheduleStatus.Pending:
        case DisbursementScheduleStatus.ReadyToSend:
          return "warning";
        case DisbursementScheduleStatus.Cancelled:
        case DisbursementScheduleStatus.Rejected:
          return "error";
        default:
          return "";
      }
    });
    const iconColor = computed(() => {
      switch (props.status) {
        case DisbursementScheduleStatus.Sent:
          return "success-shade";
        case DisbursementScheduleStatus.Pending:
        case DisbursementScheduleStatus.ReadyToSend:
          return "warning-shade";
        case DisbursementScheduleStatus.Cancelled:
        case DisbursementScheduleStatus.Rejected:
          return "error-shade";
        default:
          return "";
      }
    });
    const chipBackground = computed(() => {
      switch (props.status) {
        case DisbursementScheduleStatus.Sent:
          return "success-chip-background";
        case DisbursementScheduleStatus.Pending:
        case DisbursementScheduleStatus.ReadyToSend:
          return "warning-chip-background";
        case DisbursementScheduleStatus.Cancelled:
        case DisbursementScheduleStatus.Rejected:
          return "error-chip-background";
        default:
          return "";
      }
    });
    const textColor = computed(() => {
      switch (props.status) {
        case DisbursementScheduleStatus.Sent:
          return "success-shade";
        case DisbursementScheduleStatus.Pending:
        case DisbursementScheduleStatus.ReadyToSend:
          return "warning-shade";
        case DisbursementScheduleStatus.Cancelled:
        case DisbursementScheduleStatus.Rejected:
          return "error-shade";
        default:
          return "";
      }
    });
    const icon = computed(() => {
      switch (props.status) {
        case DisbursementScheduleStatus.Sent:
          return "fa:fa fa-check";
        case DisbursementScheduleStatus.Pending:
        case DisbursementScheduleStatus.ReadyToSend:
          return "fa:fa fa-clock-rotate-left";
        case DisbursementScheduleStatus.Cancelled:
        case DisbursementScheduleStatus.Rejected:
          return "fa:fa fa-circle-xmark";
        default:
          return "";
      }
    });
    const label = computed(() => {
      switch (props.status) {
        case DisbursementScheduleStatus.Sent:
          return "Sent";
        case DisbursementScheduleStatus.Pending:
        case DisbursementScheduleStatus.ReadyToSend:
          return "Pending";
        case DisbursementScheduleStatus.Cancelled:
        case DisbursementScheduleStatus.Rejected:
          return "Cancelled";
        default:
          return "";
      }
    });
    return {
      chipBackground,
      textColor,
      iconColor,
      chipColor,
      icon,
      label,
    };
  },
});
</script>
