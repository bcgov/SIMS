<template>
  <div>
    <div class="row">
      <header-title-value title="Institution name"
        ><template #value
          ><span
            class="link-primary"
            v-if="headerDetails.institutionId"
            @click="goToInstitution()"
          >
            {{ institutionName }}
          </span>
          <span v-else>{{ institutionName }}</span>
        </template></header-title-value
      >
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
        title="Submitted"
        :value="
          headerDetails.submittedOn
            ? dateOnlyLongString(headerDetails.submittedOn)
            : '-'
        "
      />
    </div>
    <div
      class="row mt-1"
      v-if="headerDetails.assessedBy && headerDetails.assessedDate"
    >
      <header-title-value
        :title="approvalLabel.assessedByLabel"
        :value="headerDetails.assessedBy"
      />
      <div
        class="mx-2 vertical-divider"
        v-if="headerDetails.assessedDate"
      ></div>
      <header-title-value
        :title="approvalLabel.assessedDateLabel"
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
import { computed } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useStore } from "vuex";
import { AuthService } from "@/services/AuthService";

export default {
  components: { HeaderTitleValue },
  props: {
    headerDetails: {
      type: Object,
      required: true,
      default: {} as ProgramOfferingHeader,
    },
  },
  setup(props: any) {
    const store = useStore();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();

    const institutionName = computed((): string => {
      if (AuthService.shared.authClientType === ClientIdType.Institution)
        return store.state.institution.institutionState.legalOperatingName;
      else if (AuthService.shared.authClientType === ClientIdType.AEST)
        return props.headerDetails.institutionName;
      else return "-";
    });

    const approvalLabel = computed((): ProgramOfferingApprovalLabels => {
      if (
        props.headerDetails.status === ProgramStatus.Approved ||
        props.headerDetails.assessedBy === OfferingStatus.Approved
      ) {
        return {
          assessedByLabel: "Approved By",
          assessedDateLabel: "Approved",
        };
      }
      if (
        props.headerDetails.status === ProgramStatus.Declined ||
        props.headerDetails.status === OfferingStatus.Declined
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

    const goToInstitution = () => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROFILE,
        params: { institutionId: props.headerDetails.institutionId },
      });
    };
    return {
      ProgramStatus,
      goToInstitution,
      dateOnlyLongString,
      institutionName,
      approvalLabel,
    };
  },
};
</script>
