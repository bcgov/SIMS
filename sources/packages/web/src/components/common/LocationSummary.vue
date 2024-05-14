<template>
  <!-- This component is shared between ministry and student users -->
  <body-header-container>
    <template #header>
      <body-header
        title="All locations"
        :recordsCount="institutionLocationList.length"
        ><template #actions>
          <!-- Todo: We to eventually eliminate the logic which is based
      on the client type on the vue components.-->
          <v-btn
            v-if="clientType === ClientIdType.Institution"
            class="float-right"
            color="primary"
            @click="goToAddNewLocation()"
            prepend-icon="fa:fa fa-plus-circle"
            data-cy="addLocation"
          >
            Add location
          </v-btn>
        </template>
      </body-header>
    </template>
    <content-group
      v-for="item in institutionLocationList"
      class="mb-4"
      :key="item"
      data-cy="institutionLocation"
    >
      <v-row>
        <v-col>
          <div>
            <v-icon icon="mdi-map-marker-outline"></v-icon>
            <span data-cy="locationName" class="category-header-medium mx-1">{{
              item.name
            }}</span>
            <status-chip-designation-agreement
              data-cy="institutionDesignationStatus"
              :status="item.designationStatus"
            />
          </div>
        </v-col>
        <v-col>
          <check-permission-role :role="Role.InstitutionEditLocationDetails">
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                class="float-right"
                variant="text"
                :disabled="notAllowed"
                @click="$emit('editLocation', item.id)"
                prepend-icon="fa:fa fa-gear"
                data-cy="editLocation"
              >
                Edit
              </v-btn>
            </template>
          </check-permission-role>
        </v-col>
      </v-row>
      <v-row>
        <!-- Address -->
        <v-col>
          <title-value propertyTitle="Address" />
          <span
            class="label-value muted-content clearfix"
            v-for="addressLine in addressList(item)"
            :key="addressLine"
            data-cy="institutionAddress1"
          >
            {{ addressLine }}
          </span>
        </v-col>
        <!-- Primary contact -->
        <v-col>
          <title-value propertyTitle="Primary contact" />
          <span
            class="label-value muted-content clearfix"
            v-for="contactLine in primaryContactList(item)"
            :key="contactLine"
            data-cy="institutionPrimaryContact"
          >
            {{ contactLine }}
          </span>
        </v-col>
        <!-- Institution code -->
        <v-col>
          <title-value propertyTitle="Institution location code" />
          <span
            data-cy="institutionCode"
            class="label-value muted-content clearfix"
          >
            {{ item.institutionCode }}
          </span>
        </v-col>
      </v-row>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted, computed, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { InstitutionLocationsDetails, Role } from "@/types";
import { AuthService } from "@/services/AuthService";
import StatusChipDesignationAgreement from "@/components/generic/StatusChipDesignationAgreement.vue";
import { InstitutionLocationAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  emits: ["editLocation"],
  components: {
    StatusChipDesignationAgreement,
    CheckPermissionRole,
  },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const { getFormattedAddressList } = useFormatters();
    const router = useRouter();
    const clientType = computed(() => AuthService.shared.authClientType);
    const goToAddNewLocation = () => {
      router.push({ name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION });
    };
    const institutionLocationList = ref([] as InstitutionLocationAPIOutDTO[]);

    //The institutionId is passed for ministry API
    const getInstitutionLocationList = async () => {
      institutionLocationList.value =
        await InstitutionService.shared.getAllInstitutionLocations(
          props.institutionId,
        );
    };

    const addressList = (item: InstitutionLocationsDetails) => {
      return getFormattedAddressList(item.data.address);
    };

    const primaryContactList = (item: InstitutionLocationsDetails) => {
      return [
        `${item.primaryContact.primaryContactFirstName} ${item.primaryContact.primaryContactLastName}`,
        item.primaryContact.primaryContactPhone,
        item.primaryContact.primaryContactEmail,
      ].filter((contact) => contact);
    };

    onMounted(async () => {
      await getInstitutionLocationList();
    });

    return {
      goToAddNewLocation,
      getInstitutionLocationList,
      institutionLocationList,
      ClientIdType,
      addressList,
      primaryContactList,
      clientType,
      Role,
    };
  },
});
</script>
