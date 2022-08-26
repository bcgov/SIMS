<template>
  <full-page-container :fluid-width="false">
    <template #header>
      <header-navigator
        title="Manage designations"
        :routeLocation="{ name: InstitutionRoutesConst.MANAGE_DESIGNATION }"
        subTitle="Request designation"
      />
    </template>
    <designation-agreement-form
      :model="designationModel"
      @submitDesignation="submitDesignation"
    ></designation-agreement-form>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, reactive } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import {
  useFormatters,
  useInstitutionAuth,
  useInstitutionState,
  useSnackBar,
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
import { FormIOForm } from "@/types";

export default {
  components: { DesignationAgreementForm },
  setup() {
    const router = useRouter();

    const snackBar = useSnackBar();
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

    const submitDesignation = async (form: FormIOForm<DesignationModel>) => {
      try {
        await DesignationAgreementService.shared.submitDesignationAgreement({
          dynamicData: form.data.dynamicData,
          locations: form.data.locations.map(
            (location: DesignationLocationsListItem) => ({
              locationId: location.locationId,
              requestForDesignation: location.requestForDesignation,
            }),
          ),
        } as SubmitDesignationAgreementDto);
        snackBar.success("Designation agreement submitted.");
        router.push({ name: InstitutionRoutesConst.MANAGE_DESIGNATION });
      } catch (error) {
        console.log(error, "+error");
        snackBar.error(
          "An unexpected error happened during the designation agreement submission.",
        );
      }
    };

    return {
      designationModel,
      submitDesignation,
      InstitutionRoutesConst,
    };
  },
};
</script>
