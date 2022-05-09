<template>
  <v-container>
    <v-row justify="center">
      <div class="pb-4 w-100 full-page-container-size">
        <h5 class="text-muted">Back to manage designation</h5>
        <h2 class="category-header-large">Request designation</h2>
      </div>
    </v-row>
  </v-container>
  <full-page-container>
    <designation-agreement-form
      :model="designationModel"
      @submitDesignation="submitDesignation"
    ></designation-agreement-form>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { onMounted, reactive } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import {
  useFormatters,
  useInstitutionAuth,
  useInstitutionState,
  useToastMessage,
} from "@/composables";
import { useRouter } from "vue-router";
import DesignationAgreementForm from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.vue";
import {
  DesignationModel,
  DesignationFormViewModes,
  DesignationLocationsListItem,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { SubmitDesignationAgreementDto } from "@/types/contracts/DesignationAgreementContract";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { FullPageContainer, DesignationAgreementForm },
  setup() {
    const router = useRouter();
    const toastMessage = useToastMessage();
    const formatter = useFormatters();
    const { institutionState } = useInstitutionState();
    const { userFullName, userEmail, isLegalSigningAuthority } =
      useInstitutionAuth();

    const designationModel = reactive({} as DesignationModel);
    designationModel.institutionName =
      institutionState.value.legalOperatingName;
    designationModel.institutionType = institutionState.value.institutionType;
    designationModel.isBCPrivate = institutionState.value.isBCPrivate;
    designationModel.viewMode = DesignationFormViewModes.submission;
    if (isLegalSigningAuthority) {
      // Only populates the signing officer data
      // if the current user is has the proper role.
      designationModel.dynamicData = {
        legalAuthorityName: userFullName.value,
        legalAuthorityEmailAddress: userEmail.value,
      };
    }

    onMounted(async () => {
      const locations =
        await InstitutionService.shared.getAllInstitutionLocations();
      designationModel.locations = locations.map(
        (location) =>
          ({
            locationId: location.id,
            locationName: location.name,
            locationAddress: formatter.getFormattedAddress(
              location.data.address,
            ),
            requestForDesignation: false,
          } as DesignationLocationsListItem),
      );
    });

    const submitDesignation = async (model: DesignationModel) => {
      try {
        await DesignationAgreementService.shared.submitDesignationAgreement({
          dynamicData: model.dynamicData,
          locations: model.locations.map(
            (location: DesignationLocationsListItem) => ({
              locationId: location.locationId,
              requestForDesignation: location.requestForDesignation,
            }),
          ),
        } as SubmitDesignationAgreementDto);
        toastMessage.success("Submitted", "Designation agreement submitted.");
        router.push({ name: InstitutionRoutesConst.MANAGE_DESIGNATION });
      } catch (error) {
        toastMessage.error(
          "Unexpected error",
          "And unexpected error happened during the designation agreement submission.",
        );
      }
    };

    return {
      designationModel,
      submitDesignation,
    };
  },
};
</script>
