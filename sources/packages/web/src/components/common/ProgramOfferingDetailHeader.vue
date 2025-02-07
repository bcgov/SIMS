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
      <v-divider-vertical-opaque class="mx-2 my-0" />
      <header-title-value title="Institution name"
        ><template #value
          ><span class="link-primary" @click="goToInstitutionProfile()">
            {{ headerDetails.institutionName }}
          </span>
        </template></header-title-value
      >
      <v-divider-vertical-opaque
        v-if="headerDetails.locationName"
        class="mx-2 my-0"
      />
      <header-title-value
        v-if="headerDetails.locationName"
        title="Location"
        :value="headerDetails.locationName"
      /><v-divider-vertical-opaque
        v-if="headerDetails.parentOfferingId"
        class="mx-2 my-0"
      />
      <header-title-value
        v-if="headerDetails.parentOfferingId"
        title="Parent offering ID"
        :value="headerDetails.parentOfferingId"
      />
    </div>
    <!-- Assessment details if assessed by ministry -->
    <div class="row mt-1" v-if="showApprovalDetails">
      <header-title-value
        :title="approvalLabel.assessedByLabel"
        :value="headerDetails.assessedBy"
      />
      <v-divider-vertical-opaque
        v-if="headerDetails.assessedDate"
        class="mx-2 my-0"
      />
      <header-title-value
        :title="approvalLabel.assessedDateLabel"
        v-if="headerDetails.assessedDate"
        :value="dateOnlyLongString(headerDetails.assessedDate)"
      />
      <v-divider-vertical-opaque
        v-if="headerDetails.effectiveEndDate"
        class="mx-2 my-0"
      />
      <header-title-value
        v-if="headerDetails.effectiveEndDate"
        title="Effective end date"
        :value="dateOnlyLongString(headerDetails.effectiveEndDate)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  ProgramOfferingHeader,
  ProgramStatus,
  ClientIdType,
  OfferingStatus,
  ProgramOfferingApprovalLabels,
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
    const showApprovalDetails = computed(
      () =>
        props.headerDetails.assessedBy &&
        (props.headerDetails.status === ProgramStatus.Approved ||
          props.headerDetails.status === ProgramStatus.Declined ||
          props.headerDetails.status === OfferingStatus.Approved ||
          props.headerDetails.status === OfferingStatus.CreationDeclined),
    );
    const approvalLabel = computed((): ProgramOfferingApprovalLabels => {
      if (
        props.headerDetails.assessedBy &&
        (props.headerDetails.status === ProgramStatus.Approved ||
          props.headerDetails.status === OfferingStatus.Approved)
      ) {
        return {
          assessedByLabel: "Approved By",
          assessedDateLabel: "Approved",
        };
      }
      if (
        props.headerDetails.status === ProgramStatus.Declined ||
        props.headerDetails.status === OfferingStatus.CreationDeclined
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
      } else {
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: props.headerDetails.institutionId },
        });
      }
    };
    return {
      ProgramStatus,
      goToInstitutionProfile,
      dateOnlyLongString,
      approvalLabel,
      showApprovalDetails,
    };
  },
});
</script>
