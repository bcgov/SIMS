<template>
  <div v-if="assessmentAwardData.estimatedAward">
    <!-- Show the first payment/second payment header only if there is second disbursement. -->
    <h3
      v-if="isSecondDisbursementAvailable"
      class="category-header-medium secondary-color my-3"
    >
      First Payment
    </h3>
    <v-row>
      <v-col>
        <content-group>
          <h3 class="category-header-medium primary-color my-3">
            Estimated award
          </h3>
          <!-- Estimated award table. -->
          <award-table
            :awardDetails="assessmentAwardData.estimatedAward"
            :offeringIntensity="assessmentAwardData.offeringIntensity"
            identifier="disbursement1"
          />

          <div
            class="my-3"
            v-if="
              assessmentAwardData.estimatedAward.disbursement1TuitionRemittance
            "
          >
            <status-info-label :status="StatusInfo.Completed"
              >Tuition remittance applied
              <span class="label-bold"
                >-${{
                  assessmentAwardData.estimatedAward
                    .disbursement1TuitionRemittance
                }}</span
              >
              <tooltip-icon
                >Tuition remittance is when your institution requests money from
                your award to pay for upcoming school fees.</tooltip-icon
              >
            </status-info-label>
          </div>
          <content-group-info>
            <div>
              <span class="label-bold">Earliest date of disbursement: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement1Date
              }}</span>
            </div>
            <div
              v-if="
                isFirstDisbursementCompleted &&
                assessmentAwardData.estimatedAward.disbursement1DocumentNumber
              "
            >
              <span class="label-bold">Certificate number: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement1DocumentNumber
              }}</span>
            </div>
          </content-group-info>
        </content-group>
      </v-col>
      <v-col>
        <content-group>
          <h3 class="category-header-medium primary-color my-3">Final award</h3>
          <!-- Final award table. -->
          <template v-if="showFirstFinalAward">
            <award-table
              :awardDetails="assessmentAwardData.finalAward"
              :offeringIntensity="assessmentAwardData.offeringIntensity"
              identifier="disbursementReceipt1"
            />
            <content-group-info v-if="allowFinalAwardExtendedInformation">
              <div>
                <span class="label-bold">Date eCert sent: </span>
                <span>{{
                  dateOnlyLongString(
                    assessmentAwardData.estimatedAward
                      .disbursement1DateSent as Date,
                  )
                }}</span>
              </div>
              <div>
                <span class="label-bold">Certificate number: </span>
                <span>{{
                  assessmentAwardData.estimatedAward.disbursement1DocumentNumber
                }}</span>
              </div>
            </content-group-info>
            <!-- Part-time final awards are retrieved from e-Cert generated values and requires further explanation.  -->
            <p
              v-if="
                assessmentAwardData.offeringIntensity ===
                OfferingIntensity.partTime
              "
            >
              These final award amounts are what has been requested to the
              National Student Loan Service Centre (NSLSC). If you want to
              confirm the amounts you will receive or when they will be
              disbursed, please access your
              <a
                href="https://protege-secure.csnpe-nslsc.canada.ca/en/public/sign-in-method"
                rel="noopener"
                target="_blank"
                >NSLSC account</a
              >.
            </p>
          </template>
          <p v-else>
            {{
              getFinalAwardNotAvailableMessage(
                assessmentAwardData.estimatedAward
                  .disbursement1COEStatus as COEStatus,
                assessmentAwardData.estimatedAward
                  .disbursement1Status as DisbursementScheduleStatus,
              )
            }}
          </p>
        </content-group>
      </v-col>
    </v-row>
  </div>
  <!-- Estimated and actual award details of second disbursement. -->
  <div v-if="isSecondDisbursementAvailable">
    <h3 class="category-header-medium secondary-color my-3">Second Payment</h3>
    <v-row>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Estimated award
          </div>
          <!-- Estimated award table. -->
          <award-table
            :awardDetails="assessmentAwardData.estimatedAward"
            :offeringIntensity="assessmentAwardData.offeringIntensity"
            identifier="disbursement2"
          />
          <div class="my-3">
            <status-info-enrolment
              :coeStatus="
                assessmentAwardData.estimatedAward.disbursement2COEStatus as COEStatus
              "
            />
            <confirm-enrolment
              v-if="allowConfirmEnrolment"
              :coeStatus="
                assessmentAwardData.estimatedAward.disbursement2COEStatus as COEStatus
              "
              :applicationStatus="assessmentAwardData.applicationStatus"
              :disbursementId="
                assessmentAwardData.estimatedAward.disbursement2Id as number
              "
              @confirmEnrolment="$emit('confirmEnrolment', $event)"
            />
          </div>
          <div
            class="my-3"
            v-if="
              assessmentAwardData.estimatedAward.disbursement2TuitionRemittance
            "
          >
            <status-info-label :status="StatusInfo.Completed">
              Tuition remittance applied
              <span class="label-bold"
                >-${{
                  assessmentAwardData.estimatedAward
                    .disbursement2TuitionRemittance
                }}</span
              >
              <tooltip-icon
                >Tuition remittance is when your institution requests money from
                your award to pay for upcoming school fees.</tooltip-icon
              >
            </status-info-label>
          </div>
          <content-group-info>
            <div>
              <span class="label-bold">Earliest date of disbursement: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement2Date
              }}</span>
            </div>
            <div
              v-if="
                isSecondDisbursementCompleted &&
                assessmentAwardData.estimatedAward.disbursement2DocumentNumber
              "
            >
              <span class="label-bold">Certificate number: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement2DocumentNumber
              }}</span>
            </div>
          </content-group-info>
        </content-group>
      </v-col>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Final award
          </div>
          <!-- Final award table. -->
          <template v-if="showSecondFinalAward">
            <award-table
              :awardDetails="assessmentAwardData.finalAward"
              :offeringIntensity="assessmentAwardData.offeringIntensity"
              identifier="disbursementReceipt2"
            />
            <content-group-info v-if="allowFinalAwardExtendedInformation">
              <div>
                <span class="label-bold">Date eCert sent: </span>
                <span>{{
                  dateOnlyLongString(
                    assessmentAwardData.estimatedAward
                      .disbursement2DateSent as Date,
                  )
                }}</span>
              </div>
              <div>
                <span class="label-bold">Certificate number: </span>
                <span>{{
                  assessmentAwardData.estimatedAward.disbursement2DocumentNumber
                }}</span>
              </div>
            </content-group-info>
            <!-- Part-time final awards are retrieved from e-Cert generated values and requires further explanation.  -->
            <p
              v-if="
                assessmentAwardData.offeringIntensity ===
                OfferingIntensity.partTime
              "
            >
              These final award amounts are what has been requested to the
              National Student Loan Service Centre (NSLSC). If you want to
              confirm the amounts you will receive or when they will be
              disbursed, please access your
              <a
                href="https://protege-secure.csnpe-nslsc.canada.ca/en/public/sign-in-method"
                rel="noopener"
                target="_blank"
                >NSLSC account</a
              >.
            </p>
          </template>
          <p v-else>
            {{
              getFinalAwardNotAvailableMessage(
                assessmentAwardData.estimatedAward
                  .disbursement2COEStatus as COEStatus,
                assessmentAwardData.estimatedAward
                  .disbursement2Status as DisbursementScheduleStatus,
              )
            }}
          </p>
        </content-group>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import {
  COEStatus,
  OfferingIntensity,
  StatusInfo,
  DisbursementScheduleStatus,
} from "@/types";
import { PropType, computed, defineComponent } from "vue";
import AwardTable from "@/components/common/AwardTable.vue";
import StatusInfoEnrolment from "@/components/common/StatusInfoEnrolment.vue";
import ConfirmEnrolment from "@/components/common/ConfirmEnrolment.vue";
import { useFormatters } from "@/composables";

export default defineComponent({
  emits: {
    confirmEnrolment: (disbursementId: number) => {
      return !!disbursementId;
    },
  },
  components: {
    AwardTable,
    ConfirmEnrolment,
    StatusInfoEnrolment,
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
    allowFinalAwardExtendedInformation: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { dateOnlyLongString } = useFormatters();
    const isFirstDisbursementCompleted = computed<boolean>(
      () =>
        props.assessmentAwardData.estimatedAward?.disbursement1COEStatus ===
        COEStatus.completed,
    );
    const isSecondDisbursementAvailable = computed(
      () => props.assessmentAwardData.estimatedAward?.disbursement2Date,
    );
    const isSecondDisbursementCompleted = computed<boolean>(
      () =>
        props.assessmentAwardData.estimatedAward?.disbursement2COEStatus ===
        COEStatus.completed,
    );
    const showFirstFinalAward = computed<boolean>(() => {
      return !!(
        isFirstDisbursementCompleted.value &&
        !!props.assessmentAwardData.finalAward
      );
    });
    const showSecondFinalAward = computed<boolean>(
      () =>
        !!(
          isSecondDisbursementCompleted.value &&
          !!props.assessmentAwardData.finalAward
        ),
    );

    const getFinalAwardNotAvailableMessage = (
      coeStatus: COEStatus,
      disbursementStatus: DisbursementScheduleStatus,
    ): string | undefined => {
      if (disbursementStatus === DisbursementScheduleStatus.Pending) {
        return "The final award can't be calculated at this time.";
      }
      if (disbursementStatus === DisbursementScheduleStatus.Sent) {
        // This message will be displayed only for full-time since the part-time sent e-Cert
        // will have the final awards populates, which should overrides this message entirely.
        return "The final award will be shown once confirmed by NSLSC.";
      }
      if (coeStatus === COEStatus.declined) {
        return "The final award is no longer applicable due to a change. Any scheduled disbursements will be cancelled.";
      }
      return undefined;
    };

    return {
      dateOnlyLongString,
      AESTRoutesConst,
      isSecondDisbursementAvailable,
      isSecondDisbursementCompleted,
      isFirstDisbursementCompleted,
      showFirstFinalAward,
      showSecondFinalAward,
      getFinalAwardNotAvailableMessage,
      StatusInfo,
      OfferingIntensity,
      DisbursementScheduleStatus,
    };
  },
});
</script>
