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
import { onMounted, ref } from "vue";
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

    const designationModel = ref({} as DesignationModel);

    onMounted(async () => {
      const designation =
        await DesignationAgreementService.shared.getDesignationAgreement(
          props.designationAgreementId,
        );

      designationModel.value = {
        institutionName: designation.institutionName,
        institutionType: designation.institutionType,
        isBCPrivate: designation.isBCPrivate,
        designationStatus: designation.designationStatus,
        viewMode: DesignationFormViewModes.viewOnly,
        designationStatusClass: mapDesignationChipStatus(
          designation.designationStatus,
        ),
        dynamicData: designation.submittedData,
        locations: designation.locationsDesignations.map((location) => ({
          locationId: location.locationId,
          locationName: location.locationName,
          requestForDesignation: location.requested,
          approvedForDesignation: location.approved,
          locationAddress: formatter.getFormattedAddress(
            location.locationData.address,
          ),
        })),
      };
    });

    return { designationModel, InstitutionRoutesConst };
  },
};
</script>
