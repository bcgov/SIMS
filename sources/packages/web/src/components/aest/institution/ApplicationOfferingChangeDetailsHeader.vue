<template>
  <div class="m-3">
    <v-row>
      <header-title-value
        title="Submitted date"
        :value="
          headerDetails.submittedDate
            ? dateOnlyLongString(headerDetails.submittedDate)
            : '-'
        "
      />
      <v-divider
        v-if="headerDetails.institutionName"
        class="border-opacity-100 mx-2 my-0 v-divider"
        :thickness="2"
        vertical
      />
      <header-title-value title="Institution"
        ><template #value
          ><span class="link-primary" @click="navigateToInstitutionProfile()">
            {{ headerDetails.institutionName }}
          </span>
        </template></header-title-value
      >
      <v-divider
        v-if="headerDetails.locationName"
        class="border-opacity-100 mx-2 my-0 v-divider"
        :thickness="2"
        vertical
      />
      <header-title-value
        v-if="headerDetails.locationName"
        title="Location"
        :value="headerDetails.locationName"
      />
    </v-row>
    <v-row class="mt-4" v-if="showReviewDetails">
      <header-title-value
        :iconLabel="iconLabel"
        :iconColor="iconColor"
        :title="assessedByLabel"
        :value="assessedByLabelValue"
      />
      <v-divider
        class="border-opacity-100 mx-2 my-0 v-divider"
        :thickness="2"
        vertical
      />
      <header-title-value
        :title="assessedDateLabel"
        :value="assessedDateLabelValue"
      />
    </v-row>
  </div>
</template>

<script lang="ts">
import {
  ApplicationOfferingChangeRequestHeader,
  ApplicationOfferingChangeRequestStatus,
} from "@/types";
import { useFormatters } from "@/composables";
import { computed, defineComponent, watchEffect, ref, PropType } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

interface ReviewLabels {
  assessedByLabel: string;
  assessedDateLabel: string;
}

export default defineComponent({
  props: {
    headerDetails: {
      type: Object as PropType<ApplicationOfferingChangeRequestHeader>,
      required: true,
      default: {} as ApplicationOfferingChangeRequestHeader,
    },
  },
  setup(props) {
    const iconLabel = ref("");
    const iconColor = ref("");
    const assessedByLabel = ref("");
    const assessedByLabelValue = ref("");
    const assessedDateLabel = ref("");
    const assessedDateLabelValue = ref("");
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const showReviewDetails = computed(() =>
      [
        ApplicationOfferingChangeRequestStatus.Approved,
        ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
      ].includes(props.headerDetails.status),
    );
    watchEffect(() => {
      switch (props.headerDetails.status) {
        case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
        case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
          iconLabel.value = "fa:fas fa-times-circle";
          iconColor.value = "error";
          assessedByLabel.value = "Declined By";
          assessedDateLabel.value = "Declined";
          assessedByLabelValue.value =
            props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent
              ? "Student"
              : props.headerDetails.assessedBy;
          assessedDateLabelValue.value =
            props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent
              ? dateOnlyLongString(props.headerDetails.updatedDate)
              : dateOnlyLongString(props.headerDetails.assessedDate);
          break;
        case ApplicationOfferingChangeRequestStatus.Approved:
          iconLabel.value = "fa:fas fa-check-circle";
          iconColor.value = "success";
          assessedByLabel.value = "Approved By";
          assessedDateLabel.value = "Approved";
          assessedByLabelValue.value = props.headerDetails.assessedBy;
          assessedDateLabelValue.value = dateOnlyLongString(
            props.headerDetails.assessedDate,
          );
      }
    });
    const reviewLabel = computed((): ReviewLabels => {
      if (
        props.headerDetails.status ===
        ApplicationOfferingChangeRequestStatus.Approved
      ) {
        return {
          assessedByLabel: "Approved By",
          assessedDateLabel: "Approved",
        };
      }
      if (
        [
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
        ].includes(props.headerDetails.status)
      ) {
        return {
          assessedByLabel: "Declined By",
          assessedDateLabel: "Declined",
        };
      }
      return {
        assessedByLabel: "-",
        assessedDateLabel: "-",
      };
    });

    const navigateToInstitutionProfile = () => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROFILE,
        params: { institutionId: props.headerDetails.institutionId },
      });
    };
    return {
      navigateToInstitutionProfile,
      dateOnlyLongString,
      reviewLabel,
      showReviewDetails,
      ApplicationOfferingChangeRequestStatus,
      iconLabel,
      iconColor,
      assessedByLabel,
      assessedByLabelValue,
      assessedDateLabel,
      assessedDateLabelValue,
    };
  },
});
</script>
