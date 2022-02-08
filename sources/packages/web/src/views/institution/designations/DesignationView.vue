<template>
  <v-container class="ff-form-container">
    <v-row justify="center">
      <div class="pb-4 w-100 full-page-container-size">
        <h5 class="text-muted">Back to manage designation</h5>
        <h2 class="category-header-large">View designation</h2>
      </div>
    </v-row>
  </v-container>
  <full-page-container>
    <designation-agreement-form
      :model="designationModel"
    ></designation-agreement-form>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { onMounted, reactive } from "vue";
import {
  useFormatters,
  useInstitutionState,
  useDesignationAgreement,
} from "@/composables";
import DesignationAgreementForm from "@/components/common/DesignationAgreement/DesignationAgreementForm.vue";
import {
  DesignationModel,
  DesignationFormViewModes,
} from "@/components/common/DesignationAgreement/DesignationAgreementForm.models";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";

export default {
  components: { FullPageContainer, DesignationAgreementForm },
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
    designationModel.institutionName = institutionState.value.operatingName;
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

    return { designationModel };
  },
};
</script>
