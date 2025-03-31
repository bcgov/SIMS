<template>
  <content-group-info>
    <h3 class="category-header-medium primary-color">
      {{ offeringViewData.programName }}
    </h3>
    <p>
      {{ offeringViewData.programDescription }}
    </p>
    <v-row>
      <v-col cols="12" sm="6">
        <title-value
          propertyTitle="Credential"
          :propertyValue="offeringViewData.programCredentialTypeToDisplay"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <title-value
          propertyTitle="Program delivery"
          :propertyValue="offeringViewData.programDelivery"
        />
      </v-col>
    </v-row>
  </content-group-info>
  <content-group-info>
    <h3 class="category-header-medium primary-color">
      {{ offeringViewData.offeringName }}
    </h3>
    <v-row>
      <v-col cols="12">
        <title-value
          propertyTitle="Location"
          :propertyValue="offeringViewData.locationName"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <title-value
          propertyTitle="Study intensity"
          :propertyValue="offeringViewData.offeringIntensity"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <title-value
          propertyTitle="Study delivery"
          :propertyValue="offeringViewData.offeringDelivered"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <title-value
          propertyTitle="Study dates"
          :propertyValue="
            dateOnlyLongPeriodString(
              offeringViewData.studyStartDate,
              offeringViewData.studyEndDate,
            )
          "
        />
      </v-col>
      <v-col cols="12" sm="6">
        <title-value propertyTitle="Study breaks">
          <template #value>
            <ul class="no-bullets">
              <li
                v-for="studyBreak in offeringViewData.studyBreaks"
                :key="studyBreak.breakStartDate"
              >
                {{
                  dateOnlyLongPeriodString(
                    studyBreak.breakStartDate,
                    studyBreak.breakEndDate,
                  )
                }}
              </li>
            </ul>
          </template>
        </title-value>
      </v-col>
    </v-row>
    <div v-if="studyCostAccess">
      <h3 class="category-header-medium primary-color mt-6">Study costs</h3>
      <v-row>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Tuition"
            :propertyValue="formatCurrency(offeringViewData.actualTuitionCosts)"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Program related costs"
            :propertyValue="
              formatCurrency(offeringViewData.programRelatedCosts)
            "
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Mandatory fees"
            :propertyValue="formatCurrency(offeringViewData.mandatoryFees)"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Exceptional expenses"
            :propertyValue="
              formatCurrency(offeringViewData.exceptionalExpenses)
            "
          />
        </v-col>
      </v-row>
    </div>
  </content-group-info>
</template>

<script lang="ts">
import { useFormatters } from "@/composables";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramOfferingSummaryViewAPIOutDTO } from "@/services/http/dto";
import { OfferingSummaryPurpose } from "@/types/contracts/OfferingSummaryPurpose";
import { defineComponent, watch, ref } from "vue";

export default defineComponent({
  props: {
    offeringId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: false,
    },
    studyCostAccess: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  setup(props) {
    const { dateOnlyLongPeriodString, formatCurrency } = useFormatters();
    const offeringViewData = ref(
      {} as EducationProgramOfferingSummaryViewAPIOutDTO,
    );

    watch(
      () => [props.offeringId, props.locationId],
      async () => {
        if (props.offeringId) {
          offeringViewData.value =
            await EducationProgramOfferingService.shared.getOfferingSummaryDetailsById(
              props.offeringId,
              {
                locationId: props.locationId,
                purpose: OfferingSummaryPurpose.ApplicationOfferingChange,
              },
            );
        }
      },
      {
        immediate: true,
      },
    );

    return {
      offeringViewData,
      formatCurrency,
      dateOnlyLongPeriodString,
    };
  },
});
</script>
