<template>
  <div>
    <!-- Basic details -->
    <div class="row">
      <header-title-value
        title="Submitted"
        :value="
          headerDetails.submittedDate
            ? dateOnlyLongString(headerDetails.submittedDate)
            : '-'
        "
      />
      <div class="mx-2 vertical-divider"></div>
      <header-title-value title="Institution name"
        ><template #value
          ><span class="link-primary" @click="goToInstitutionProfile()">
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
    <!-- Assessment details if assessed by ministry -->
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
      <div class="row pl-4">
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
        <div
          class="mx-2 vertical-divider"
          v-if="headerDetails.effectiveEndDate"
        ></div>
        <header-title-value
          v-if="headerDetails.effectiveEndDate"
          title="Effective end date"
          :value="dateOnlyLongString(headerDetails.effectiveEndDate)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ProgramOfferingHeader,
  ProgramStatus,
  ClientIdType,
  OfferingStatus,
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
      default: {} as ProgramOfferingHeader,
    },
  },
  setup(props) {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const showReviewDetails = computed(
      () =>
        (props.headerDetails.assessedBy || props.headerDetails.updatedDate) &&
        (props.headerDetails.status === ProgramStatus.Approved ||
          props.headerDetails.status === ProgramStatus.Declined ||
          props.headerDetails.status === OfferingStatus.Approved ||
          props.headerDetails.status === OfferingStatus.CreationDeclined ||
          props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.Approved ||
          props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC ||
          props.headerDetails.status ===
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent),
    );
    const reviewLabel = computed((): ReviewLabels => {
      if (
        props.headerDetails.assessedBy &&
        (props.headerDetails.status === ProgramStatus.Approved ||
          props.headerDetails.status === OfferingStatus.Approved ||
          props.headerDetails.applicationOfferingChangeRequestStatus ===
            ApplicationOfferingChangeRequestStatus.Approved)
      ) {
        return {
          assessedByLabel: "Approved By",
          assessedDateLabel: "Approved",
        };
      }
      if (
        props.headerDetails.status === ProgramStatus.Declined ||
        props.headerDetails.status === OfferingStatus.CreationDeclined ||
        props.headerDetails.status ===
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC ||
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

    const goToInstitutionProfile = () => {
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
      goToInstitutionProfile,
      dateOnlyLongString,
      reviewLabel,
      showReviewDetails,
      ApplicationOfferingChangeRequestStatus,
    };
  },
});
</script>
