<template>
  <content-group>
    <award-table
      :disbursement="assessmentAwardData.firstDisbursement"
      :offering-intensity="assessmentAwardData.offeringIntensity"
      :application-status="assessmentAwardData.applicationStatus"
      :allow-confirm-enrolment="allowConfirmEnrolment"
      :allow-disbursement-cancellation="allowDisbursementCancellation"
      :allow-final-award-extended-information="
        allowFinalAwardExtendedInformation
      "
      :header="
        isSecondDisbursementAvailable ? 'First disbursement' : 'Disbursement'
      "
      @disbursement-cancelled="$emit('disbursementCancelled')"
      @confirm-enrolment="$emit('confirmEnrolment', $event)"
    />
  </content-group>
  <content-group v-if="isSecondDisbursementAvailable" class="mt-4">
    <award-table
      :disbursement="assessmentAwardData.secondDisbursement"
      :offering-intensity="assessmentAwardData.offeringIntensity"
      :application-status="assessmentAwardData.applicationStatus"
      :allow-confirm-enrolment="allowConfirmEnrolment"
      :allow-disbursement-cancellation="allowDisbursementCancellation"
      :allow-final-award-extended-information="
        allowFinalAwardExtendedInformation
      "
      header="Second Disbursement"
      @disbursement-cancelled="$emit('disbursementCancelled')"
      @confirm-enrolment="$emit('confirmEnrolment', $event)"
    />
  </content-group>
</template>
<script lang="ts">
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { PropType, computed, defineComponent } from "vue";
import AwardTable from "@/components/common/AwardTable.vue";

export default defineComponent({
  emits: {
    confirmEnrolment: (disbursementId: number) => {
      return !!disbursementId;
    },
    disbursementCancelled: null,
  },
  components: {
    AwardTable,
  },
  props: {
    assessmentAwardData: {
      type: Object as PropType<AwardDetailsAPIOutDTO>,
      required: true,
      default: {} as AwardDetailsAPIOutDTO,
    },
    allowConfirmEnrolment: {
      type: Boolean,
      required: false,
    },
    allowDisbursementCancellation: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowFinalAwardExtendedInformation: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const isSecondDisbursementAvailable = computed(
      () => !!props.assessmentAwardData.secondDisbursement,
    );

    return {
      isSecondDisbursementAvailable,
    };
  },
});
</script>
