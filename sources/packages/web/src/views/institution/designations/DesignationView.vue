<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage designations"
        subTitle="View Designation"
        :routeLocation="{
          name: InstitutionRoutesConst.MANAGE_DESIGNATION,
        }"
      />
    </template>
    <designation-agreement-form
      :model="designationModel"
      :view-only="true"
    ></designation-agreement-form>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, reactive } from "vue";
import { useFormatters, useDesignationAgreement } from "@/composables";
import DesignationAgreementForm from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.vue";
import {
  DesignationModel,
  DesignationFormViewModes,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { DesignationAgreementForm },
  props: {
    designationAgreementId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const formatter = useFormatters();
    const { mapDesignationChipStatus } = useDesignationAgreement();
    const designationModel = reactive({
      viewMode: DesignationFormViewModes.viewOnly,
    } as DesignationModel);

    onMounted(async () => {
      const designation =
        await DesignationAgreementService.shared.getDesignationAgreement(
          props.designationAgreementId,
        );

      designationModel.institutionName = designation.institutionName;
      designationModel.institutionType = designation.institutionType;
      designationModel.isBCPrivate = designation.isBCPrivate;
      designationModel.designationStatus = designation.designationStatus;
      designationModel.designationStatusClass = mapDesignationChipStatus(
        designation.designationStatus,
      );
      designationModel.dynamicData = designation.submittedData;
      designationModel.locations = designation.locationsDesignations.map(
        (location) => ({
          locationId: location.locationId,
          locationName: location.locationName,
          requestForDesignation: location.requested,
          approvedForDesignation: location.approved,
          locationAddress: formatter.getFormattedAddress(
            location.locationData.address,
          ),
        }),
      );
    });

    return { designationModel, InstitutionRoutesConst };
  },
};
</script>
