<template>
  <div>
    <v-row>
      <v-col cols="12">
        <content-group>
          <award-table
            :assessment-award-data="assessmentAwardData"
            :allow-confirm-enrolment="allowConfirmEnrolment"
            :allow-disbursement-cancellation="allowDisbursementCancellation"
            :allow-final-award-extended-information="
              allowFinalAwardExtendedInformation
            "
            identifier="disbursement1"
            final-identifier="disbursementReceipt1"
            :header="
              isSecondDisbursementAvailable
                ? 'First disbursement'
                : 'Disbursement'
            "
            @disbursement-cancelled="$emit('disbursementCancelled')"
            @confirm-enrolment="$emit('confirmEnrolment', $event)"
          />
        </content-group>
      </v-col>
    </v-row>
  </div>
  <div v-if="isSecondDisbursementAvailable">
    <v-row>
      <v-col>
        <content-group>
          <award-table
            :assessment-award-data="assessmentAwardData"
            :allow-confirm-enrolment="allowConfirmEnrolment"
            :allow-disbursement-cancellation="allowDisbursementCancellation"
            :allow-final-award-extended-information="
              allowFinalAwardExtendedInformation
            "
            identifier="disbursement2"
            final-identifier="disbursementReceipt2"
            header="Second Disbursement"
            @disbursement-cancelled="$emit('disbursementCancelled')"
            @confirm-enrolment="$emit('confirmEnrolment', $event)"
          />
        </content-group>
      </v-col>
    </v-row>
  </div>
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
      () => props.assessmentAwardData.estimatedAward?.disbursement2Date,
    );

    return {
      isSecondDisbursementAvailable,
    };
  },
});
</script>
