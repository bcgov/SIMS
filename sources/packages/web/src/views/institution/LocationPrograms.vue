<template>
  <v-container>
    <h5 class="color-grey">{{ locationName }}</h5>
    <h2>Add new program</h2>
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
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">Offering</h2>
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
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

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
    const goToAddNewProgram = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: { locationId: props.locationId },
      });
    };
    const goToAddNewOffering = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        params: { locationId: props.locationId, programId: 1 },
      });
    };

    return { goToAddNewProgram, goToAddNewOffering };
  },
};
</script>
