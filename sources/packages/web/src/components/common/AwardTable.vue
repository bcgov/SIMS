<template>
  <body-header :title="header">
    <template #status-chip>
      <status-chip-disbursement :status="disbursement.status" />
    </template>
  </body-header>
  <v-row>
    <v-col cols="12">
      <v-table class="bordered">
        <thead>
          <tr>
            <th scope="col" class="text-left font-weight-bold">
              Loan/grant type
            </th>
            <th scope="col" class="text-left font-weight-bold">
              Estimated award
            </th>
            <th
              v-if="showFinalAward"
              scope="col"
              class="text-left font-weight-bold"
            >
              Final award
            </th>
            <th
              v-if="showAdjustments"
              scope="col"
              class="text-left font-weight-bold"
            >
              Adjustments
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="award in awards" :key="award.awardType">
            <td>
              <span v-if="$vuetify.display.smAndDown">
                {{ award.awardTypeDisplay }}
                <tooltip-icon>{{ award.awardDescription }}</tooltip-icon>
              </span>
              <span v-else>
                {{ award.awardDescription }}
              </span>
            </td>
            <td>
              {{ award.estimatedAmount }}
            </td>
            <td v-if="showFinalAward">
              {{ award.finalAmount }}
            </td>
            <td v-if="showAdjustments">
              <assessment-award-adjustments
                :adjustments="{
                  restriction: award.hasRestrictionAdjustment,
                  disbursed: award.hasDisbursedAdjustment,
                  positiveOveraward: award.hasPositiveOverawardAdjustment,
                  negativeOveraward: award.hasNegativeOverawardAdjustment,
                }"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-col>
  </v-row>
  <div class="my-3">
    <status-info-enrolment
      :coe-status="disbursement.coeStatus"
      :enrolment-date="disbursement.enrolmentDate"
    />
    <confirm-enrolment
      v-if="allowConfirmEnrolment"
      :coe-status="disbursement.coeStatus"
      :application-status="applicationStatus"
      :disbursement-id="disbursement.id"
      @confirm-enrolment="$emit('confirmEnrolment', $event)"
    />
  </div>
  <div class="my-3" v-if="disbursement.tuitionRemittance">
    <status-info-label :status="StatusInfo.Completed"
      >Tuition remittance applied
      <span class="label-bold">-${{ disbursement.tuitionRemittance }}</span>
      <tooltip-icon
        >Tuition remittance is when your institution requests money from your
        award to pay for upcoming school fees.</tooltip-icon
      >
    </status-info-label>
  </div>

  <content-group-info>
    <div>
      <span class="label-bold">Earliest date of disbursement: </span>
      <span>{{ dateOnlyLongString(disbursement.disbursementDate) }}</span>
    </div>
    <div v-if="isDisbursementCompleted && disbursement.documentNumber">
      <span class="label-bold">Cert number: </span>
      <span>{{ disbursement.documentNumber }}</span>
    </div>
    <div v-if="allowFinalAwardExtendedInformation && !!disbursement.dateSent">
      <span class="label-bold">Date sent: </span>
      <span>{{ dateOnlyLongString(disbursement.dateSent) }}</span>
    </div>
  </content-group-info>
  <div class="my-3">
    <status-info-disbursement-cancellation
      v-if="disbursement.status === DisbursementScheduleStatus.Rejected"
      :cancellation-date="disbursement.statusUpdatedOn"
    />
    <cancel-disbursement-schedule
      v-if="canCancelDisbursement"
      :disbursement-id="disbursement.id"
      @disbursement-cancelled="$emit('disbursementCancelled')"
    />
  </div>

  <div></div>
</template>
<script lang="ts">
import { PropType, defineComponent, computed } from "vue";
import {
  ApplicationStatus,
  AssessmentAwardData,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
  StatusInfo,
} from "@/types";
import { AWARDS, AwardDetail } from "@/constants/award-constants";
import { useFormatters } from "@/composables";
import AssessmentAwardAdjustments from "@/components/common/students/applicationDetails/AssessmentAwardAdjustments.vue";
import StatusChipDisbursement from "@/components/generic/StatusChipDisbursement.vue";
import StatusInfoEnrolment from "@/components/common/StatusInfoEnrolment.vue";
import StatusInfoDisbursementCancellation from "@/components/common/StatusInfoDisbursementCancellation.vue";
import ConfirmEnrolment from "@/components/common/ConfirmEnrolment.vue";
import CancelDisbursementSchedule from "@/components/common/CancelDisbursementSchedule.vue";
import { AwardDisbursementScheduleAPIOutDTO } from "@/services/http/dto";

const AWARD_NOT_ELIGIBLE = "(Not eligible)";

/**
 * Statuses which allow Adjustments to be shown.
 */
const ADJUSTMENT_STATUSES = new Set([
  DisbursementScheduleStatus.Pending,
  DisbursementScheduleStatus.ReadyToSend,
  DisbursementScheduleStatus.Sent,
]);

/**
 * Statuses which allow Final Award to be shown.
 */
const FINAL_AWARD_STATUSES = new Set([
  DisbursementScheduleStatus.ReadyToSend,
  DisbursementScheduleStatus.Sent,
]);

export default defineComponent({
  emits: {
    confirmEnrolment: (disbursementId: number) => {
      return !!disbursementId;
    },
    disbursementCancelled: null,
  },
  components: {
    AssessmentAwardAdjustments,
    CancelDisbursementSchedule,
    ConfirmEnrolment,
    StatusChipDisbursement,
    StatusInfoEnrolment,
    StatusInfoDisbursementCancellation,
  },
  props: {
    disbursement: {
      type: Object as PropType<AwardDisbursementScheduleAPIOutDTO>,
      required: true,
      default: {} as AwardDisbursementScheduleAPIOutDTO,
    },
    offeringIntensity: {
      type: String as PropType<OfferingIntensity>,
      required: true,
    },
    applicationStatus: {
      type: String as PropType<ApplicationStatus>,
      required: true,
    },
    header: {
      type: String,
      required: true,
    },
    allowConfirmEnrolment: {
      type: Boolean,
      required: false,
    },
    allowFinalAwardExtendedInformation: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowDisbursementCancellation: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  setup(props) {
    const awardTypes = computed<AwardDetail[]>(() =>
      AWARDS.filter(
        (award) => award.offeringIntensity === props.offeringIntensity,
      ),
    );

    const { currencyFormatter, dateOnlyLongString } = useFormatters();

    // Associate disbursement values with their award types.
    const awards: AssessmentAwardData[] = awardTypes.value.map((award) => {
      const disbursementValue = props.disbursement.disbursementValues.find(
        (value) => {
          return value.valueCode === award.awardType;
        },
      );
      const estimatedAmount = disbursementValue
        ? currencyFormatter(disbursementValue.valueAmount, "-")
        : AWARD_NOT_ELIGIBLE;
      const finalAmount = disbursementValue
        ? currencyFormatter(disbursementValue.effectiveAmount, "-")
        : AWARD_NOT_ELIGIBLE;

      return {
        awardType: award.awardType,
        awardTypeDisplay: award.awardTypeDisplay,
        awardDescription: award.description,
        estimatedAmount,
        finalAmount,
        hasDisbursedAdjustment:
          disbursementValue?.hasDisbursedAdjustment ?? false,
        hasRestrictionAdjustment:
          disbursementValue?.hasRestrictionAdjustment ?? false,
        hasNegativeOverawardAdjustment:
          disbursementValue?.hasNegativeOverawardAdjustment ?? false,
        hasPositiveOverawardAdjustment:
          disbursementValue?.hasPositiveOverawardAdjustment ?? false,
      };
    });

    const showFinalAward = computed(() => {
      return FINAL_AWARD_STATUSES.has(props.disbursement.status);
    });

    const showAdjustments = computed(() => {
      return ADJUSTMENT_STATUSES.has(props.disbursement.status);
    });

    const isDisbursementCompleted = computed<boolean>(
      () => props.disbursement.coeStatus === COEStatus.completed,
    );

    const canCancelDisbursement = computed<boolean>(() => {
      return (
        props.allowDisbursementCancellation &&
        props.disbursement.status === DisbursementScheduleStatus.Sent &&
        !props.disbursement.receiptReceived
      );
    });

    return {
      awards,
      showFinalAward,
      showAdjustments,
      DisbursementScheduleStatus,
      isDisbursementCompleted,
      dateOnlyLongString,
      StatusInfo,
      canCancelDisbursement,
    };
  },
});
</script>
