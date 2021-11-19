<template>
  <v-container>
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Programs</a
      >
    </h5>
    <h3>Program Detail</h3>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <span class="category-header-large color-blue">
              {{ educationProgram.name }}
            </span>
            <Chip
              :label="educationProgram.approvalStatus"
              class="ml-2 bg-success text-white p-text-uppercase"
              >{{ educationProgram.approvalStatus }}</Chip
            >
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" outlined @click="goToEditProgram()">
              <v-icon size="25" left> mdi-open-in-new </v-icon>
              Edit Program
            </v-btn>
          </v-col>
        </v-row>
        <v-row class="secondary-color">
          <v-col cols="5">
            <span class="category-header-medium-small">Description</span>
            <br />
            <p>{{ educationProgram.name }}</p>
          </v-col>
          <v-col cols="4"
            ><span class="font-weight-bold">Offering</span> <br />
            <p>
              <span
                v-if="
                  educationProgram.programIntensity ===
                    ProgramIntensity.fullTimePartTime ||
                    educationProgram.programIntensity ===
                      ProgramIntensity.fullTime
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
            <p>{{ educationProgram.credentialType }}</p>
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
        <v-divider></v-divider>
        <v-row>
          <v-col cols="8">
            <span class="category-header-medium color-blue"
              >Study period offerings</span
            >
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" @click="goToAddNewOffering()">
              <v-icon size="25" left>
                mdi-open-in-new
              </v-icon>
              Add Another Offering
            </v-btn>
          </v-col>
        </v-row>
        <DataTable :autoLayout="true" :value="offerings">
          <Column field="offeringName" header="Name" :sortable="true"></Column>
          <Column
            field="studyDates"
            header="Study Dates"
            :sortable="true"
          ></Column>
          <Column field="offeringIntensity" header="Type" :sortable="true"
            ><template #body="slotProps">
              <span>{{ slotProps.data.offeringIntensity }} </span>
            </template>
          </Column>
          <Column
            field="offeringDelivered"
            header="Study Delivery"
            :sortable="true"
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn plain @click="goToEditOffering(slotProps.data.id)">
                <v-icon size="25" left> mdi-open-in-new </v-icon>
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
  ProgramIntensity,
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
      ProgramIntensity,
    };
  },
};
</script>
