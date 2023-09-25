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
      <separator v-if="headerDetails.institutionName"></separator>
      <header-title-value title="Institution"
        ><template #value
          ><span class="link-primary" @click="navigateToInstitutionProfile()">
            {{ headerDetails.institutionName }}
          </span>
        </template></header-title-value
      >
      <separator v-if="headerDetails.locationName" />
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
      <separator />
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
import { computed, defineComponent, watchEffect, ref } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

interface ReviewLabels {
  assessedByLabel: string;
  assessedDateLabel: string;
}

export default defineComponent({
  props: {
    headerDetails: {
      type: Object,
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
    const showReviewDetails = computed(
      () =>
        (props.headerDetails.assessedBy || props.headerDetails.updatedDate) &&
        [
          ApplicationOfferingChangeRequestStatus.Approved,
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
        ].includes(props.headerDetails.status),
    );
    const checkHeaderDetailsStatus = (
      statuses: ApplicationOfferingChangeRequestStatus[],
    ): boolean => {
      return statuses.includes(props.headerDetails.status);
    };
    watchEffect(() => {
      if (
        [
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        ].includes(props.headerDetails.status)
      ) {
        iconLabel.value = "fa:fas fa-times-circle";
        iconColor.value = "error";
        assessedByLabel.value = "Declined By";
        assessedDateLabel.value = "Declined";
        if (
          props.headerDetails.status ===
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent
        ) {
          assessedByLabelValue.value = "Student";
          assessedDateLabelValue.value = dateOnlyLongString(
            props.headerDetails.updatedDate,
          );
        }
      } else if (
        props.headerDetails.status ===
        ApplicationOfferingChangeRequestStatus.Approved
      ) {
        iconLabel.value = "fa:fas fa-check-circle";
        iconColor.value = "success";
        assessedByLabel.value = "Approved By";
        assessedDateLabel.value = "Approved";
      }
      if (
        [
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          ApplicationOfferingChangeRequestStatus.Approved,
        ].includes(props.headerDetails.status)
      ) {
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
      checkHeaderDetailsStatus,
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
