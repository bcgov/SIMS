<template>
  <div class="mb-4">
    <span class="category-header-large color-blue">
      {{ educationProgram.name }}
    </span>
    <program-status-chip
      class="ml-2"
      :status="educationProgram.programStatus"
    ></program-status-chip>
    <v-btn
      class="float-right"
      variant="outlined"
      @click="programButtonAction()"
      :color="COLOR_BLUE"
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
import { computed } from "vue";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { ProgramIntensity, ClientIdType } from "@/types";
import ProgramStatusChip from "@/components/generic/ProgramStatusChip.vue";
import { COLOR_BLUE } from "@/constants";
import { AuthService } from "@/services/AuthService";
import { EducationProgramDetailsAPIOutDTO } from "@/services/http/dto";

export default {
  components: { ProgramStatusChip },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramDetailsAPIOutDTO,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });

    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
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
          },
        });
      }

      if (isAESTUser.value) {
        router.push({
          name: AESTRoutesConst.VIEW_PROGRAM,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      }
    };

    return {
      programButtonAction,
      ProgramIntensity,
      isInstitutionUser,
      isAESTUser,
      programActionLabel,
      COLOR_BLUE,
    };
  },
};
</script>
