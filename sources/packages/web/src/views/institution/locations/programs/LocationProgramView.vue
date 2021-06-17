<template>
  <v-container>
    <h5 class="color-grey">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Programs</a
      >
    </h5>
    <h4>View Program</h4>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">{{ educationProgram.name }}</h2>
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" outlined @click="goToEditProgram()">
              <v-icon left> mdi-open-in-new </v-icon>
              Edit Program
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="5">
            <h6>Description</h6>
            <br />
            <p>{{ educationProgram.name }}</p>
          </v-col>
          <v-col cols="4"
            ><h6>Credential Type</h6>
            <br />
            <p>{{ educationProgram.credentialType }}</p>
          </v-col>
          <v-col cols="2"
            ><h6>Status</h6>
            <br />
            <Chip
              :label="educationProgram.approvalStatus"
              class="p-mr-2 p-mb-2 bg-success text-white p-text-uppercase"
              >{{ educationProgram.approvalStatus }}</Chip
            >
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="5">
            <h6>Classification of Instructional Programs (CIP)</h6>
            <br />
            <p>{{ educationProgram.cipCode }}</p>
          </v-col>
          <v-col cols="4"
            ><h6>National Occupational Classification (NOC)</h6>
            <br />
            <p>{{ educationProgram.nocCode }}</p>
          </v-col>
          <v-col cols="3"
            ><h6>SABC Code</h6>
            <br />
            <p>{{ educationProgram.sabcCode }}</p>
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">Offerings</h2>
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" @click="goToAddNewOffering()">
              <v-icon left>
                mdi-open-in-new
              </v-icon>
              Add Another Offering
            </v-btn>
          </v-col>
        </v-row>
        <DataTable :autoLayout="true" :value="offerings">
          <Column field="name" header="Name" :sortable="true"></Column>
          <Column
            field="studyDates"
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
              <v-btn plain @click="goToEditOffering(slotProps.data.id)">
                <v-icon left> mdi-open-in-new </v-icon>
                Edit
              </v-btn>
            </template>
          </Column>
        </DataTable>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { InstitutionRoutesConst } from "../../../../constants/routes/RouteConstants";
import { EducationProgramService } from "../../../../services/EducationProgramService";
import { EducationProgramOfferingService } from "../../../../services/EducationProgramOfferingService";
import {
  EducationProgramOfferingDto,
  EducationProgramDto,
} from "../../../../types";

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
    locationName: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();

    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
          locationName: props.locationName,
        },
      });
    };

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
          offeringId: offeringId,
          programId: props.programId,
          locationId: props.locationId,
        },
      });
    };

    const offerings = ref([] as EducationProgramOfferingDto[]);
    const educationProgram = ref({} as EducationProgramDto);
    const getEducationProgramAndOffering = async () => {
      const offeringsRequest = EducationProgramOfferingService.shared.getAllEducationProgramOffering(
        props.locationId,
        props.programId,
      );
      const educationProgramRequest = EducationProgramService.shared.getEducationProgram(
        props.programId,
      );
      const [offeringsValue, educationProgramValue] = await Promise.all([
        offeringsRequest,
        educationProgramRequest,
      ]);
      offerings.value = offeringsValue;
      educationProgram.value = educationProgramValue;
    };

    onMounted(getEducationProgramAndOffering);

    return {
      goBack,
      goToEditProgram,
      goToAddNewOffering,
      educationProgram,
      offerings,
      goToEditOffering,
    };
  },
};
</script>
