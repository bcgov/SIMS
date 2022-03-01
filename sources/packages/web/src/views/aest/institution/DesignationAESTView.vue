<template>
  <div class="p-m-4">
    <header-navigator
      title="Manage designations"
      subTitle="View designation agreement"
      :routeLocation="{
        name: AESTRoutesConst.INSTITUTION_DESIGNATION,
        params: { institutionId: institutionId },
      }"
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
import { useFormatters, useDesignationAgreement } from "@/composables";
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
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const formatter = useFormatters();
    const { mapDesignationChipStatus } = useDesignationAgreement();

    const designationModel = reactive({} as DesignationModel);

    onMounted(async () => {
      const designation = await DesignationAgreementService.shared.getDesignationAgreement(
        props.designationAgreementId,
      );

      designationModel.institutionName = designation.institutionName;
      designationModel.institutionType = designation.institutionType;
      designationModel.isBCPrivate = designation.isBCPrivate;
      designationModel.viewMode = DesignationFormViewModes.viewOnly;
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
