<template>
  <v-container>
    <h5 class="color-grey">Edit Program Info</h5>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">Programs</h2>
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
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

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
  },
  setup(props: any) {
    const router = useRouter();

    const goToEditProgram = () => {
      router.push({
        name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
        params: { programId: props.programId, locationId: props.locationId },
      });
    };

    return { goToEditProgram };
  },
};
</script>
