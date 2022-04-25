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
      v-if="ProgramStatus.Approved === educationProgram.programStatus"
    >
      <header-title-value
        title="Approved by"
        :value="educationProgram.assessedBy ?? '-'"
        v-if="educationProgram.assessedBy"
      />
      <div
        class="mx-2 vertical-divider"
        v-if="educationProgram.assessedBy"
      ></div>
      <header-title-value
        title="Approved"
        v-if="educationProgram.assessedDate"
        :value="
          educationProgram.assessedDate
            ? dateOnlyLongString(educationProgram.assessedDate)
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
      v-if="ProgramStatus.Denied === educationProgram.programStatus"
    >
      <header-title-value
        title="Denied by"
        :value="educationProgram.assessedBy"
      />
      <div class="mx-2 vertical-divider"></div>
      <header-title-value
        title="Denied"
        :value="
          educationProgram.assessedDate
            ? dateOnlyLongString(educationProgram.assessedDate)
            : '-'
        "
      />
    </div>
  </div>
</template>

<script lang="ts">
import { EducationProgramData, ProgramStatus, ClientIdType } from "@/types";
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

    const goToInstitution = () => {
      if (props.institutionId)
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: props.institutionId },
        });
    };
    return {
      ProgramStatus,
      goToInstitution,
      dateOnlyLongString,
      institutionName,
    };
  },
};
</script>
