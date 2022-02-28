<template>
  <div class="p-m-4">
    <header-navigator
      title="Manage designations"
      subTitle="View designation agreement"
      :routeLocation="{ name: AESTRoutesConst.AEST_DASHBOARD }"
    />
    <full-page-container class="mt-4">
      <designation-agreement-form
        :model="designationModel"
      ></designation-agreement-form>
    </full-page-container>
  </div>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { onMounted, reactive } from "vue";
import {
  useFormatters,
  useInstitutionState,
  useDesignationAgreement,
} from "@/composables";
import DesignationAgreementForm from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.vue";
import {
  DesignationModel,
  DesignationFormViewModes,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { HeaderNavigator, DesignationAgreementForm, FullPageContainer },
  props: {
    designationAgreementId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const { institutionState } = useInstitutionState();
    const formatter = useFormatters();
    const { mapDesignationChipStatus } = useDesignationAgreement();

    const designationModel = reactive({} as DesignationModel);
    designationModel.institutionName =
      institutionState.value.legalOperatingName;
    designationModel.institutionType = institutionState.value.institutionType;
    designationModel.isBCPrivate = institutionState.value.isBCPrivate;
    designationModel.viewMode = DesignationFormViewModes.viewOnly;

    onMounted(async () => {
      const designation = await DesignationAgreementService.shared.getDesignationAgreement(
        props.designationAgreementId,
      );

      designationModel.designationStatus = designation.designationStatus;
      designationModel.designationStatusClass = mapDesignationChipStatus(
        designation.designationStatus,
      );
      designationModel.dynamicData = designation.submittedData;
      designationModel.locations = designation.locationsDesignations.map(
        location => ({
          locationId: location.locationId,
          locationName: location.locationName,
          requestForDesignation: location.requested,
          approvedForDesignation: location.approved,
          locationAddress: formatter.getFormattedAddress({
            ...location.locationData.address,
            provinceState: location.locationData.address.province,
          }),
        }),
      );
    });

    return { designationModel, AESTRoutesConst };
  },
};
</script>
