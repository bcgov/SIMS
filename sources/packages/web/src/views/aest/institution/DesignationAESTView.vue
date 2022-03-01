<template>
  <div class="p-m-4">
    <header-navigator
      :title="navigationTitle"
      subTitle="View designation agreement"
      :routeLocation="routeLocation"
    >
      <template #buttons>
        <v-btn color="primary" outlined>Decline</v-btn>
        <v-btn class="ml-2 primary-btn-background">Approve designation</v-btn>
      </template>
    </header-navigator>
    <full-page-container class="mt-4">
      <designation-agreement-form
        :model="designationFormModel"
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
    const designationFormModel = reactive({} as DesignationModel);
    const navigationTitle = props.institutionId
      ? "Manage designations"
      : "Pending designations";
    const routeLocation = props.institutionId
      ? {
          name: AESTRoutesConst.INSTITUTION_DESIGNATION,
          params: { institutionId: props.institutionId },
        }
      : { name: AESTRoutesConst.PENDING_DESIGNATIONS };

    onMounted(async () => {
      const designationAgreement = await DesignationAgreementService.shared.getDesignationAgreement(
        props.designationAgreementId,
      );

      designationFormModel.institutionName =
        designationAgreement.institutionName;
      designationFormModel.institutionType =
        designationAgreement.institutionType;
      designationFormModel.isBCPrivate = designationAgreement.isBCPrivate;
      designationFormModel.viewMode = DesignationFormViewModes.viewOnly;
      designationFormModel.designationStatus =
        designationAgreement.designationStatus;
      designationFormModel.designationStatusClass = mapDesignationChipStatus(
        designationAgreement.designationStatus,
      );
      designationFormModel.dynamicData = designationAgreement.submittedData;
      designationFormModel.locations = designationAgreement.locationsDesignations.map(
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

    return { designationFormModel, routeLocation, navigationTitle };
  },
};
</script>
