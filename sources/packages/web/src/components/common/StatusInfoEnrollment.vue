<template>
  <status-info-label :status="enrollmentStatus.status">{{
    enrollmentStatus.header
  }}</status-info-label>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from "vue";
import { StatusInfo, COEStatus } from "@/types";

export interface EnrollmentStatusInfo {
  status: StatusInfo;
  header: string;
}

export default defineComponent({
  props: {
    coeStatus: {
      type: Object as PropType<COEStatus>,
      required: true,
    },
  },
  setup(props) {
    const enrollmentStatus = computed<EnrollmentStatusInfo>(() => {
      switch (props.coeStatus) {
        case COEStatus.completed:
          return {
            status: StatusInfo.Completed,
            header: "Enrollment confirmed",
          };
        case COEStatus.required:
          return {
            status: StatusInfo.Pending,
            header: "Enrollment not confirmed",
          };
        case COEStatus.declined:
          return {
            status: StatusInfo.Rejected,
            header: "Enrollment declined",
          };
        default:
          return { status: StatusInfo.Pending, header: "" };
      }
    });
    return {
      enrollmentStatus,
    };
  },
});
</script>
