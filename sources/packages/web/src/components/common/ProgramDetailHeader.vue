<template>
  <div class="ml-4 mb-2">
    <div class="row">
      <header-title-value
        title="Institution name"
        :value="educationProgram.institutionName"
      />
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
      <header-title-value title="Approved by" :value="approvedBy" />
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
        title="Approved"
        :value="
          educationProgram.approvedOn
            ? dateOnlyLongString(educationProgram.approvedOn)
            : '-'
        "
      />
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
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
      <header-title-value title="Denied by" :value="deniedBy" />
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
        title="Denied"
        :value="
          educationProgram.deniedOn
            ? dateOnlyLongString(educationProgram.deniedOn)
            : '-'
        "
      />
    </div>
  </div>
</template>

<script lang="ts">
import { EducationProgramData, ApprovalStatus } from "@/types";
import HeaderTitleValue from "@/components/generic/HeaderTitleValue.vue";
import { useFormatters } from "@/composables";
import { computed } from "vue";

export default {
  components: { HeaderTitleValue },
  props: {
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramData,
    },
  },
  setup(props: any) {
    const { dateOnlyLongString } = useFormatters();
    const getFullName = (firstName: string, lastName: string) => {
      if (firstName && lastName) {
        return `${lastName}, ${firstName}`;
      } else {
        return "-";
      }
    };
    const approvedBy = computed(() =>
      getFullName(
        props.educationProgram.approvedByFirstName,
        props.educationProgram.approvedByLastName,
      ),
    );
    const deniedBy = computed(() =>
      getFullName(
        props.educationProgram.deniedByFirstName,
        props.educationProgram.deniedByLastName,
      ),
    );
    return { dateOnlyLongString, approvedBy, deniedBy, ApprovalStatus };
  },
};
</script>
