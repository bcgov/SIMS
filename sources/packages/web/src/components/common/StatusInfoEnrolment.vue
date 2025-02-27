<template>
  <status-info-label :status="enrollmentStatus.status">{{
    enrollmentStatus.header
  }}</status-info-label>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from "vue";
import { StatusInfo, COEStatus } from "@/types";
import { useFormatters } from "@/composables";

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
    enrolmentDate: {
      type: Date,
      required: false,
    },
  },
  setup(props) {
    const { dateOnlyLongString } = useFormatters();
    const enrollmentStatus = computed<EnrollmentStatusInfo>(() => {
      switch (props.coeStatus) {
        case COEStatus.completed:
          return {
            status: StatusInfo.Completed,
            header: `Enrolment confirmed on ${dateOnlyLongString(
              props.enrolmentDate,
            )}`,
          };
        case COEStatus.required:
          return {
            status: StatusInfo.Pending,
            header: "Enrolment not confirmed",
          };
        case COEStatus.declined:
          return {
            status: StatusInfo.Rejected,
            header: "Enrolment declined",
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
