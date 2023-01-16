<template>
  <banner
    v-if="
      coeApprovalPeriodStatus !== COEApprovalPeriodStatus.WithinApprovalPeriod
    "
    class="mb-2"
    :type="BannerTypes.Warning"
    :header="header"
    :summary="summary"
  />
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from "vue";
import { COEApprovalPeriodStatus, BannerTypes } from "@/types";

export default defineComponent({
  props: {
    coeApprovalPeriodStatus: {
      type: String as PropType<COEApprovalPeriodStatus>,
      required: true,
    },
  },
  setup(props) {
    const header = computed<string>(() => {
      switch (props.coeApprovalPeriodStatus) {
        case COEApprovalPeriodStatus.BeforeApprovalPeriod:
          return "Enrolment is not available to confirm yet";
        case COEApprovalPeriodStatus.AfterApprovalPeriod:
          return "Enrolment cannot be confirmed ";
        default:
          return "";
      }
    });

    const summary = computed<string>(() => {
      switch (props.coeApprovalPeriodStatus) {
        case COEApprovalPeriodStatus.BeforeApprovalPeriod:
          return (
            "This application will be required to confirm enrolment," +
            " however it is still outside of the 21 day window before" +
            " you can confirm enrolment. Please check back within 21 days of the disbursement date."
          );
        case COEApprovalPeriodStatus.AfterApprovalPeriod:
          return (
            "The study end date has past and you can no longer confirm enrolment for this application." +
            " Please contact StudentAid BC for help."
          );
        default:
          return "";
      }
    });
    return {
      BannerTypes,
      header,
      summary,
      COEApprovalPeriodStatus,
    };
  },
});
</script>
