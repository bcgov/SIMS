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
            {{ educationProgram.institutionName }}
          </a>
          <span v-else>{{ educationProgram.institutionName }}</span>
        </template></header-title-value
      >
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
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

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
    const router = useRouter();
    const { originalDateOnlyLongString, dateOnlyLongString } = useFormatters();
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
    const goToInstitution = () => {
      if (props.institutionId)
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: props.institutionId },
        });
    };
    return {
      originalDateOnlyLongString,
      approvedBy,
      deniedBy,
      ApprovalStatus,
      goToInstitution,
      dateOnlyLongString,
    };
  },
};
</script>
