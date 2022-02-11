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
            ? originalDateOnlyLongString(educationProgram.submittedOn)
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
        :value="approvedBy ?? '-'"
        v-if="approvedBy"
      />
      <div class="mx-2 vertical-divider" v-if="approvedBy"></div>
      <header-title-value
        title="Approved"
        v-if="educationProgram.approvedOn"
        :value="
          educationProgram.approvedOn
            ? originalDateOnlyLongString(educationProgram.approvedOn)
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
            ? originalDateOnlyLongString(educationProgram.effectiveEndDate)
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
            ? originalDateOnlyLongString(educationProgram.deniedOn)
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
    const { originalDateOnlyLongString } = useFormatters();
    const getFullName = (firstName: string, lastName: string) => {
      if (firstName && lastName) {
        return `${lastName}, ${firstName}`;
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
    return { originalDateOnlyLongString, approvedBy, deniedBy, ApprovalStatus };
  },
};
</script>
