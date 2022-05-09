<template>
  <div class="p-m-4">
    <header-navigator
      title="Manage designations"
      subTitle="View designations"
      :routeLocation="{
        name: InstitutionRoutesConst.MANAGE_DESIGNATION,
      }"
    />
    <full-page-container class="mt-4">
      <!-- Form.io is not reactively binding the property readOnly. Hence loading the form only after API call is completed. -->
      <!-- If the readOnly value change after DOM(form) is mounted, form does not respond to it.  -->
      <designation-agreement-form
        v-if="modelLoaded"
        :model="designationModel"
      ></designation-agreement-form>
    </full-page-container>
  </div>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { onMounted, reactive, ref } from "vue";
import { useFormatters, useDesignationAgreement } from "@/composables";
import DesignationAgreementForm from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.vue";
import {
  DesignationModel,
  DesignationFormViewModes,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { FullPageContainer, DesignationAgreementForm, HeaderNavigator },
  props: {
    designationAgreementId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const formatter = useFormatters();
    const { mapDesignationChipStatus } = useDesignationAgreement();
    const designationModel = reactive({} as DesignationModel);
    const modelLoaded = ref(false);

    onMounted(async () => {
      const designation =
        await DesignationAgreementService.shared.getDesignationAgreement(
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
      modelLoaded.value = true;
    });

    return { designationModel, InstitutionRoutesConst, modelLoaded };
  },
};
</script>
