<template>
  <v-container>
    <h5 class="color-grey">{{ locationName }}</h5>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">Programs</h2>
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" @click="goToAddNewProgram()">
              <v-icon left>
                mdi-open-in-new
              </v-icon>
              Create New Program
            </v-btn>
          </v-col>
        </v-row>
        <DataTable :value="programs">
          <Column field="cipCode" header="CIP" :sortable="true"></Column>
          <Column field="name" header="Program Name" :sortable="true"></Column>
          <Column field="credentialType" header="Credential" :sortable="true">
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.credentialType }}
              </div>
            </template></Column
          >
          <Column
            field="totalOfferings"
            header="Offerings"
            :sortable="true"
          ></Column>
          <Column field="approvalStatus" header="Status" :sortable="true"
            ><template #body="slotProps">
              <Chip
                :label="slotProps.data.approvalStatus"
                class="p-mr-2 p-mb-2 bg-success text-white p-text-uppercase"/></template
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn outlined @click="goToProgram(slotProps.data.id)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramService } from "../../services/EducationProgramService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { SummaryEducationProgramDto } from "../../types";
import { onMounted, ref } from "vue";

export default {
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const programs = ref([] as SummaryEducationProgramDto[]);

    onMounted(async () => {
      programs.value = await EducationProgramService.shared.getPrograms();
    });

    const goToAddNewProgram = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: { locationId: props.locationId },
      });
    };

    const goToProgram = (programId: number) => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: { locationId: props.locationId },
      });
    };

    return { programs, goToAddNewProgram, goToProgram };
  },
};
</script>
