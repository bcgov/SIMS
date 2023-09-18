<template>
  <div>
    <div class="row">
      <header-title-value
        title="Submitted date"
        :value="
          headerDetails.submittedDate
            ? dateOnlyLongString(headerDetails.submittedDate)
            : '-'
        "
      />
      <div
        v-if="headerDetails.institutionName"
        class="mx-2 vertical-divider"
      ></div>
      <header-title-value title="Institution"
        ><template #value
          ><span class="link-primary" @click="navigateToInstitutionProfile()">
            {{ headerDetails.institutionName }}
          </span>
        </template></header-title-value
      >
      <div
        v-if="headerDetails.locationName"
        class="mx-2 vertical-divider"
      ></div>
      <header-title-value
        v-if="headerDetails.locationName"
        title="Location"
        :value="headerDetails.locationName"
      />
    </div>
    <div class="row mt-1" v-if="showReviewDetails">
      <div
        class="row pl-4"
        v-if="
          headerDetails.status ===
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent
        "
      >
        <header-title-value
          :title="reviewLabel.assessedByLabel"
          value="Student"
        />
        <div class="mx-2 vertical-divider"></div>
        <header-title-value
          :title="reviewLabel.assessedDateLabel"
          :value="dateOnlyLongString(headerDetails.updatedDate)"
        />
      </div>
      <div
        class="row pl-4"
        v-if="
          headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.Approved ||
          headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC
        "
      >
        <header-title-value
          :title="reviewLabel.assessedByLabel"
          v-if="headerDetails.assessedBy"
          :value="headerDetails.assessedBy"
        />
        <div
          class="mx-2 vertical-divider"
          v-if="headerDetails.assessedDate"
        ></div>
        <header-title-value
          :title="reviewLabel.assessedDateLabel"
          v-if="headerDetails.assessedDate"
          :value="dateOnlyLongString(headerDetails.assessedDate)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ApplicationOfferingChangeRequestHeader,
  ProgramStatus,
  ClientIdType,
  ApplicationOfferingChangeRequestStatus,
  ReviewLabels,
} from "@/types";
import HeaderTitleValue from "@/components/generic/HeaderTitleValue.vue";
import { useFormatters } from "@/composables";
import { computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  AESTRoutesConst,
  InstitutionRoutesConst,
} from "@/constants/routes/RouteConstants";
import { AuthService } from "@/services/AuthService";

export default defineComponent({
  components: { HeaderTitleValue },
  props: {
    headerDetails: {
      type: Object,
      required: true,
      default: {} as ApplicationOfferingChangeRequestHeader,
    },
  },
  setup(props) {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const showReviewDetails = computed(
      () =>
        (props.headerDetails.assessedBy || props.headerDetails.updatedDate) &&
        (props.headerDetails.status ===
          ApplicationOfferingChangeRequestStatus.Approved ||
          props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC ||
          props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent),
    );
    const reviewLabel = computed((): ReviewLabels => {
      if (
        props.headerDetails.assessedBy &&
        props.headerDetails.status ===
          ApplicationOfferingChangeRequestStatus.Approved
      ) {
        return {
          assessedByLabel: "Approved By",
          assessedDateLabel: "Approved",
        };
      }
      if (
        (props.headerDetails.assessedBy &&
          props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC) ||
        props.headerDetails.status ===
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent
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
      if (AuthService.shared.authClientType === ClientIdType.Institution) {
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        });
      }
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROFILE,
        params: { institutionId: props.headerDetails.institutionId },
      });
    };
    return {
      ProgramStatus,
      navigateToInstitutionProfile,
      dateOnlyLongString,
      reviewLabel,
      showReviewDetails,
      ApplicationOfferingChangeRequestStatus,
    };
  },
});
</script>
