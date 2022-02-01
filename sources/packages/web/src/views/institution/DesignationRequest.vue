<template>
  <v-container class="ff-form-container">
    <v-row justify="center">
      <div class="pb-4 w-100 full-page-container-size">
        <h5 class="text-muted">Back to manage designation</h5>
        <h2 class="category-header-large">Request designation</h2>
      </div>
    </v-row>
  </v-container>

  <full-page-container>
    <formio
      formName="designationagreementdetails"
      :data="initialData"
      @submitted="submitDesignation"
      @loaded="formLoaded"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import formio from "@/components/generic/formio.vue";
import { ref, onMounted } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import {
  useFormatters,
  useInstitutionAuth,
  useInstitutionState,
  useToastMessage,
} from "@/composables";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

interface DesignationLocationsListItem {
  locationId: number;
  locationName: string;
  locationAddress: string;
  requestForDesignation: boolean;
}

interface DesignationModel {
  institutionName: string;
  institutionType: string;
  locations: DesignationLocationsListItem[];
  dynamicData: {
    legalAuthorityName: string;
    legalAuthorityEmailAddress: string;
  };
}

export default {
  components: { formio, FullPageContainer },
  setup() {
    const router = useRouter();
    const toastMessage = useToastMessage();
    const formatter = useFormatters();
    const { institutionState } = useInstitutionState();
    const {
      isLegalSigningAuthority,
      userFullName,
      userEmail,
    } = useInstitutionAuth();
    const initialData = ref({} as DesignationModel);

    const loadInitialDesignationModel = async () => {
      const model = {} as DesignationModel;
      if (isLegalSigningAuthority.value) {
        model.dynamicData = {
          legalAuthorityName: userFullName.value,
          legalAuthorityEmailAddress: userEmail.value,
        };
      }
      model.institutionName = institutionState.value.operatingName;
      model.institutionType = institutionState.value.institutionType;
      const locations = await InstitutionService.shared.getAllInstitutionLocations();
      model.locations = locations.map(location => ({
        locationId: location.id,
        locationName: location.name,
        locationAddress: formatter.getFormattedAddress({
          ...location.data.address,
          provinceState: location.data.address.province,
        }),
        requestForDesignation: false,
      }));

      initialData.value = model;
    };

    onMounted(async () => {
      loadInitialDesignationModel();
    });

    const MANAGE_LOCATIONS_LINK = "goToManageLocations";
    const MANAGE_USERS_LINK = "goToManageUsers";

    const formLoaded = async () => {
      const goToManageLocations = document.getElementById(
        MANAGE_LOCATIONS_LINK,
      );
      goToManageLocations!.onclick = _ => {
        router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
      };
      const goToManageUsers = document.getElementById(MANAGE_USERS_LINK);
      goToManageUsers!.onclick = _ => {
        router.push({ name: InstitutionRoutesConst.MANAGE_USERS });
      };
    };

    const submitDesignation = async (args: any) => {
      // Filter the locations that are checked.
      const checkedLocations = initialData.value.locations.filter(
        (location: DesignationLocationsListItem) =>
          location.requestForDesignation,
      );
      // Get the ids of the checked locations.
      const checkedLocationIds = checkedLocations.map(
        (location: DesignationLocationsListItem) => location.locationId,
      );
      try {
        await DesignationAgreementService.shared.submitDesignationAgreement({
          submittedData: args.dynamicData,
          requestedLocationsIds: checkedLocationIds,
        });
        toastMessage.success("Submitted", "Designation agreement submitted.");
        await router.push({ name: InstitutionRoutesConst.MANAGE_DESIGNATION });
      } catch (error) {
        toastMessage.success(
          "Unexpected error",
          "And unexpected error happened during the designation agreement submission.",
        );
      }
    };

    return { initialData, formLoaded, submitDesignation };
  },
};
</script>
