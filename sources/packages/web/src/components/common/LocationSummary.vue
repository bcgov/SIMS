<template>
  <!-- This component is shared between ministry and student users -->
  <v-row>
    <v-col cols="8">
      <p class="category-header-large color-blue">
        All Locations({{ institutionLocationList.length ?? 0 }})
      </p>
    </v-col>
    <v-col cols="4" v-if="clientType === ClientIdType.Institution">
      <v-btn class="float-right" @click="goToAddNewLocation()" color="primary">
        <v-icon :size="25" left>mdi-map-marker-plus</v-icon>Add New Location
      </v-btn>
    </v-col>
  </v-row>
  <ContentGroup
    v-for="item in institutionLocationList"
    :key="item"
    class="ma-2"
  >
    <v-row>
      <v-col cols="10">
        <span>
          <font-awesome-icon icon="map-pin" />
          <span class="category-header-medium mx-2">{{ item.name }}</span>
          <designation-and-restriction-status-badge
            class="mb-4 ml-4"
            status="designated"
          />
        </span>
      </v-col>
      <v-col cols="2" v-if="clientType === ClientIdType.Institution">
        <v-btn plain @click="getLocation(item.id)">
          <v-icon :size="25" right class="mr-2"> mdi-cog-outline </v-icon>
          Edit
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <!-- Address 1 -->
      <v-col>
        <TitleValue propertyTitle="Address 1" />
        <span
          class="text-muted clearfix"
          v-for="addressLine in addressList1(item)"
          :key="addressLine"
        >
          {{ addressLine }}
        </span>
      </v-col>

      <!-- Address 2 -->
      <v-col>
        <TitleValue propertyTitle="Address 2" />
        <span>---</span>
      </v-col>

      <!-- Primary contact -->
      <v-col>
        <TitleValue propertyTitle=" Primary Contact" />
        <span
          class="text-muted clearfix"
          v-for="contactLine in primaryContactList(item)"
          :key="contactLine"
        >
          {{ contactLine }}
        </span>
      </v-col>
      <!-- Institution code -->
      <v-col>
        <TitleValue
          propertyTitle="Institution code"
          :propertyValue="item.institutionCode"
        />
      </v-col>
    </v-row>
  </ContentGroup>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import DesignationAndRestrictionStatusBadge from "@/components/generic/DesignationAndRestrictionStatusBadge.vue";
import TitleValue from "@/components/generic/TitleValue.vue";
import { InstitutionLocationsDetails } from "@/types";

export default {
  components: {
    ContentGroup,
    DesignationAndRestrictionStatusBadge,
    TitleValue,
  },
  props: {
    clientType: {
      type: String,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const goToAddNewLocation = () => {
      router.push({ name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION });
    };
    const getLocation = async (locationId: number) => {
      router.push({
        name: InstitutionRoutesConst.EDIT_INSTITUTION_LOCATION,
        params: {
          locationId: locationId,
        },
      });
    };
    const institutionLocationList = ref([] as InstitutionLocationsDetails[]);
    const getInstitutionLocationList = async () => {
      switch (props.clientType) {
        case ClientIdType.Institution:
          institutionLocationList.value = await InstitutionService.shared.getAllInstitutionLocations();
          break;
        case ClientIdType.AEST:
          institutionLocationList.value = await InstitutionService.shared.getAllInstitutionLocationSummary(
            props.institutionId,
          );
          break;
      }
    };

    const addressList1 = (item: InstitutionLocationsDetails) => {
      return [
        item.data.address.addressLine1,
        item.data.address.addressLine2,
        `${item.data.address.city} ${item.data.address.province}, ${item.data.address.postalCode}`,
        item.data.address.country,
      ].filter(address => address);
    };

    const primaryContactList = (item: InstitutionLocationsDetails) => {
      return [
        `${item.primaryContact.primaryContactFirstName} ${item.primaryContact.primaryContactLastName}`,
        item.primaryContact.primaryContactPhone,
        item.primaryContact.primaryContactEmail,
      ].filter(contact => contact);
    };

    onMounted(async () => {
      getInstitutionLocationList();
    });

    return {
      goToAddNewLocation,
      getLocation,
      getInstitutionLocationList,
      institutionLocationList,
      ClientIdType,
      addressList1,
      primaryContactList,
    };
  },
};
</script>
