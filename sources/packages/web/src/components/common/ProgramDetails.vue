<template>
  <body-header :title="educationProgram.name">
    <template #status-chip>
      <status-chip-program
        class="ml-2 mb-2"
        :status="educationProgram.programStatus"
      ></status-chip-program>
    </template>
    <template #actions>
      <v-btn
        class="float-right label-bold"
        variant="outlined"
        @click="programButtonAction"
        color="primary"
      >
        {{ programActionLabel }}
      </v-btn>
    </template>
  </body-header>
  <v-row>
    <v-col md="5" lg="5" xl="5">
      <title-value
        propertyTitle="Description"
        :propertyValue="educationProgram.description"
      />
    </v-col>
    <v-col md="4" lg="4" xl="4">
      <title-value propertyTitle="Description" />
      <p class="label-value muted-content clearfix">
        <span
          v-if="
            educationProgram.programIntensity ===
              ProgramIntensity.fullTimePartTime ||
            educationProgram.programIntensity === ProgramIntensity.fullTime
          "
          >Full Time</span
        >
        <br />
        <span
          v-if="
            educationProgram.programIntensity ===
            ProgramIntensity.fullTimePartTime
          "
          >Part Time
        </span>
      </p>
    </v-col>
    <v-col>
      <title-value
        propertyTitle="Credential Type"
        :propertyValue="educationProgram.credentialTypeToDisplay"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col md="5" lg="5" xl="5">
      <title-value
        propertyTitle="Classification of Instructional Programs (CIP)"
        :propertyValue="educationProgram.cipCode"
      />
    </v-col>
    <v-col md="4" lg="4" xl="4"
      ><title-value
        propertyTitle="National Occupational Classification (NOC)"
        :propertyValue="educationProgram.nocCode"
      />
    </v-col>
    <v-col
      ><title-value
        propertyTitle="Institution Program Code"
        :propertyValue="educationProgram.institutionProgramCode"
      />
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
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { AuthService } from "@/services/AuthService";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";

export default {
  components: { StatusChipProgram },
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
      default: {} as EducationProgramAPIOutDTO,
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
    };
  },
};
</script>
