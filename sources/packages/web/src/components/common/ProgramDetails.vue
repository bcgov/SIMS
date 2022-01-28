<template>
  <div class="mb-4">
    <span class="category-header-large color-blue">
      {{ educationProgram.name }}
    </span>
    <status-badge
      class="ml-2"
      :status="getProgramStatusToGeneralStatus(educationProgram.approvalStatus)"
    ></status-badge>
    <v-btn
      class="float-right"
      outlined
      @click="programButtonAction()"
      color="#2965C5"
    >
      {{ programActionLabel }}
    </v-btn>
  </div>
  <v-row class="secondary-color">
    <v-col cols="5">
      <span class="category-header-medium-small">Description</span>
      <br />
      <p>{{ educationProgram.description }}</p>
    </v-col>
    <v-col cols="4"
      ><span class="font-weight-bold">Offering</span> <br />
      <p>
        <span
          v-if="
            educationProgram.programIntensity ===
              ProgramIntensity.fullTimePartTime ||
              educationProgram.programIntensity === ProgramIntensity.fullTime
          "
          >Full Time</span
        >
        <br /><span
          v-if="
            educationProgram.programIntensity ===
              ProgramIntensity.fullTimePartTime
          "
          >Part Time
        </span>
      </p>
    </v-col>
    <v-col cols="2"
      ><span class="font-weight-bold">Credential Type</span>
      <br />
      <p>{{ educationProgram.credentialTypeToDisplay }}</p>
    </v-col>
  </v-row>
  <v-row class="secondary-color">
    <v-col cols="5">
      <span class="font-weight-bold"
        >Classification of Instructional Programs (CIP)</span
      >
      <br />
      <p>{{ educationProgram.cipCode }}</p>
    </v-col>
    <v-col cols="4"
      ><span class="font-weight-bold"
        >National Occupational Classification (NOC)</span
      >
      <br />
      <p>{{ educationProgram.nocCode }}</p>
    </v-col>
    <v-col cols="3"
      ><span class="font-weight-bold">Institution Program Code</span>
      <br />
      <p>{{ educationProgram.institutionProgramCode }}</p>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, computed } from "vue";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramData, ProgramIntensity, ClientIdType } from "@/types";
import StatusBadge from "@/components/generic/StatusBadge.vue";
import { useFormatStatuses } from "@/composables";

export default {
  components: { StatusBadge },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    clientType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const { getProgramStatusToGeneralStatus } = useFormatStatuses();

    const isInstitutionUser = computed(() => {
      return props.clientType === ClientIdType.Institution;
    });

    const isAESTUser = computed(() => {
      return props.clientType === ClientIdType.AEST;
    });

    const programActionLabel = computed(() => {
      return isInstitutionUser.value ? "Edit" : "View Program";
    });

    const programButtonAction = () => {
      if (isInstitutionUser.value) {
        router.push({
          name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
            clientType: ClientIdType.Institution,
          },
        });
      }

      if (isAESTUser.value) {
        router.push({
          name: AESTRoutesConst.VIEW_PROGRAM,
          params: {
            programId: props.programId,
            locationId: props.locationId,
            clientType: ClientIdType.AEST,
          },
        });
      }
    };

    const educationProgram = ref({} as EducationProgramData);
    const getEducationProgramAndOffering = async () => {
      if (isInstitutionUser.value) {
        educationProgram.value = await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
      } else if (isAESTUser.value) {
        educationProgram.value = await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );
      }
    };

    onMounted(getEducationProgramAndOffering);

    return {
      programButtonAction,
      educationProgram,
      ProgramIntensity,
      getProgramStatusToGeneralStatus,
      isInstitutionUser,
      isAESTUser,
      programActionLabel,
    };
  },
};
</script>
