<template>
  <v-container>
    <h5 class="color-grey">View Program</h5>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue"></h2>
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" @click="goToEditProgram()">
              <v-icon left>
                mdi-open-in-new
              </v-icon>
              Edit Program
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </v-container>
  <v-container>
    <v-row>
      <v-col cols="8">
        <h2 class="color-blue">Offerings</h2>
      </v-col>
      <v-col cols="4">
        <v-btn class="float-right" @click="goToAddNewOffering()">
          <v-icon left>
            mdi-open-in-new
          </v-icon>
          Create New Offering
        </v-btn>
      </v-col>
    </v-row>
    <DataTable :autoLayout="true" :value="offerings">
      <Column field="name" header="Name" :sortable="true"></Column>
      <Column
        field="studyStartDate"
        header="Study Dates"
        :sortable="true"
      ></Column>
      <Column
        field="offeringDelivered"
        header="Study Delivery"
        :sortable="true"
      ></Column>
      <Column>
        <template #body="slotProps">
          <v-btn outlined @click="goToEditOffering(slotProps.data.id)"
            >Edit</v-btn
          >
        </template>
      </Column>
    </DataTable>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { InstitutionRoutesConst } from "../../../../constants/routes/RouteConstants";
import { EducationProgramService } from "../../../../services/EducationProgramService";
import { EducationProgramOfferingService } from "../../../../services/EducationProgramOfferingService";
import { EducationProgramOfferingDto } from "../../../../types";

export default {
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();

    const goToEditProgram = () => {
      router.push({
        name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
        params: { programId: props.programId, locationId: props.locationId },
      });
    };

    const goToAddNewOffering = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        params: { locationId: props.locationId, programId: props.programId },
      });
    };

    const goToEditOffering = (offeringId: number) => {
      router.push({
        name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
        params: {
          offeringId,
          programId: props.programId,
          locationId: props.locationId,
        },
      });
    };

    const offerings = ref([] as EducationProgramOfferingDto[]);
    const educationProgram = ref();
    const getEducationProgramAndOffering = async () => {
      offerings.value = await EducationProgramOfferingService.shared.getAllEducationProgramOffering(
        props.locationId,
        props.programId,
      );
      educationProgram.value = await EducationProgramService.shared.getEducationProgram(
        props.programId,
      );
    };

    onMounted(getEducationProgramAndOffering);

    return {
      goToEditProgram,
      goToAddNewOffering,
      educationProgram,
      offerings,
      goToEditOffering,
    };
  },
};
</script>
