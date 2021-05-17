<template>
  <v-container>
    <h5 class="color-grey">Manage Institution Locations</h5>
    <h2>Location Summary</h2>
    <v-sheet
      elevation="1"
      class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">Locations</h2>
          </v-col>
          <v-col cols="4">
            <v-btn
              class="float-right"
              @click="goToAddNewLocation()"
            >
              Add New Location
              <v-icon right>
                mdi-map-marker-plus
              </v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <div
          v-for="item in institutionLocationList"
          :key="item"
          class="ma-2 location-box"
        >
          <v-row>
            <v-col cols="10">
              <h4>
                <v-icon>mdi-map-marker-radius</v-icon>
                {{ item.name }}
                <!-- TODO: Replace v-badge with vuetify2 equavalent v-chip with icon once veutify3 is released-->
                <v-badge
                  bordered
                  color="green"
                  content="&#10004;  DESIGNATED"
                  location="top-right"
                  text-color="white"
                >
                  <template v-slot:default>
                    <v-icon>mdi-map-markers-radius</v-icon>
                  </template>
                </v-badge>
              </h4>
            </v-col>
            <v-col cols="2">
              <v-btn
                plain>
                <v-icon
                  right
                  class="mr-2">
                  mdi-cog-outline
                </v-icon>
                Edit
              </v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <span class="pb-2"><b> Location </b></span><br />
              <span class="mt-2">
                {{ item.data.address.addressLine1 }}
                <br />
              </span>
              <span v-if="item.data.address.addressLine2">
                {{ item.data.address.addressLine2 }}
                <br />
              </span>
              <span>
                {{ item.data.address.city }}, {{ item.data.address.province }},
                {{ item.data.address.postalCode }}
                <br />
              </span>
              <span>{{ item.data.address.country }}</span>
            </v-col>
            <v-col>
              <span class="pb-2"><b> Primary Contact </b></span><br />
              <span class="mt-2">
                {{
                  item.institution.institutionPrimaryContact
                    .primaryContactFirstName
                }}
                {{
                  item.institution.institutionPrimaryContact
                    .primaryContactLastName
                }}
                <br />
              </span>
              <span
                v-if="
                  item.institution.institutionPrimaryContact.primaryContactPhone
                "
              >
                {{
                  item.institution.institutionPrimaryContact.primaryContactPhone
                }}
                <br />
              </span>
              <span
                v-if="
                  item.institution.institutionPrimaryContact.primaryContactEmail
                "
              >
                {{
                  item.institution.institutionPrimaryContact.primaryContactEmail
                }}
                <br />
              </span>
            </v-col>
          </v-row>
          <v-divider></v-divider>
          <!-- TODO: below values are todo -->
          <v-row>
            <v-col>
              <span><b>250</b></span> Students
            </v-col>
            <v-col>
              <span><b>250</b></span> Programs
            </v-col>
            <v-col>
              <span><b>250</b></span> Users
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { InstitutionService } from "../../services/InstitutionService";

export default {
  setup() {
    const router = useRouter();
    const goToAddNewLocation = () => {
      router.push({ name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION });
    };
    const institutionLocationList = ref([]);
    const getInstitutionLocationList = async () => {
      institutionLocationList.value = await InstitutionService.shared.getAllInstitutionLocations();
    };

    onMounted(getInstitutionLocationList);
    return {
      goToAddNewLocation,
      getInstitutionLocationList,
      institutionLocationList,
    };
  },
};
</script>
