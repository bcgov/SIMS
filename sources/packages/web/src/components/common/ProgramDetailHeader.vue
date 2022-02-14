<template>
  <div class="ml-4 mb-2">
    <div class="row">
      <header-title-value title="Institution name"
        ><template #value
          ><a
            v-if="institutionId"
            @click="goToInstitution()"
            class="label-bold-primary"
          >
            {{ institutionName }}
          </a>
          <span v-else>{{ institutionName }}</span>
        </template></header-title-value
      >
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
        title="Submitted"
        :value="
          educationProgram.submittedOn
            ? dateOnlyLongString(educationProgram.submittedOn)
            : '-'
        "
      />
    </div>
    <div
      class="row mt-1"
      v-if="ApprovalStatus.approved === educationProgram.approvalStatus"
    >
      <header-title-value
        title="Approved by"
        :value="statusUpdateBy ?? '-'"
        v-if="statusUpdateBy"
      />
      <div class="mx-2 vertical-divider" v-if="statusUpdateBy"></div>
      <header-title-value
        title="Approved"
        v-if="educationProgram.statusUpdatedOn"
        :value="
          educationProgram.statusUpdatedOn
            ? dateOnlyLongString(educationProgram.statusUpdatedOn)
            : '-'
        "
      />
      <div
        class="mx-2 vertical-divider"
        v-if="educationProgram.effectiveEndDate"
      ></div>
      <header-title-value
        v-if="educationProgram.effectiveEndDate"
        title="Effective end date"
        :value="
          educationProgram.effectiveEndDate
            ? dateOnlyLongString(educationProgram.effectiveEndDate)
            : '-'
        "
      />
    </div>
    <div
      class="row mt-1"
      v-if="ApprovalStatus.denied === educationProgram.approvalStatus"
    >
      <header-title-value title="Denied by" :value="statusUpdateBy" />
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
        title="Denied"
        :value="
          educationProgram.statusUpdatedOn
            ? dateOnlyLongString(educationProgram.statusUpdatedOn)
            : '-'
        "
      />
    </div>
  </div>
</template>

<script lang="ts">
import { EducationProgramData, ApprovalStatus, ClientIdType } from "@/types";
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
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramData,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const store = useStore();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();

    const institutionName = computed(() => {
      if (AuthService.shared.authClientType === ClientIdType.Institution)
        return store.state.institution.institutionState.legalOperatingName;
      else if (AuthService.shared.authClientType === ClientIdType.AEST)
        return props.educationProgram.institutionName;
      else return "-";
    });

    const statusUpdateBy = computed(() => {
      if (
        props.educationProgram.statusUpdatedByFirstName &&
        props.educationProgram.statusUpdatedByLastName
      ) {
        return `${props.educationProgram.statusUpdatedByLastName}, ${props.educationProgram.statusUpdatedByFirstName}`;
      } else return undefined;
    });

    const goToInstitution = () => {
      if (props.institutionId)
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: props.institutionId },
        });
    };
    return {
      ApprovalStatus,
      goToInstitution,
      dateOnlyLongString,
      institutionName,
      statusUpdateBy,
    };
  },
};
</script>
