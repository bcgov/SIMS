<template>
  <div class="p-m-4">
    <header-navigator
      :title="navigationTitle"
      subTitle="View designation agreement"
      :routeLocation="routeLocation"
    >
      <template #buttons>
        <v-btn
          color="primary"
          outlined
          @click="updateDesignation(DesignationAgreementStatus.Declined)"
          >Decline</v-btn
        >
        <v-btn
          class="ml-2 primary-btn-background"
          @click="updateDesignation(DesignationAgreementStatus.Approved)"
          >Approve designation</v-btn
        >
      </template>
    </header-navigator>
    <full-page-container class="mt-4">
      <designation-agreement-form
        :model="designationFormModel"
      ></designation-agreement-form>
    </full-page-container>
    <approve-deny-designation
      ref="approveDenyDesignationModal"
      :designation="updateDesignationModel"
    />
  </div>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { onMounted, reactive, ref } from "vue";
import {
  useFormatters,
  useDesignationAgreement,
  ModalDialog,
  useToastMessage,
} from "@/composables";
import DesignationAgreementForm from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.vue";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { InstitutionService } from "@/services/InstitutionService";
import {
  UpdateDesignationDto,
  DesignationAgreementStatus,
  UpdateDesignationLocationDto,
  GetDesignationAgreementDto,
} from "@/types/contracts/DesignationAgreementContract";
import {
  DesignationModel,
  DesignationFormViewModes,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApproveDenyDesignation from "@/views/aest/institution/ApproveDenyDesignation.vue";

export default {
  components: {
    HeaderNavigator,
    DesignationAgreementForm,
    FullPageContainer,
    ApproveDenyDesignation,
  },
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
    const designationAgreement = ref({} as GetDesignationAgreementDto);
    const designationFormModel = reactive({} as DesignationModel);
    const showModal = ref(false);
    const toast = useToastMessage();
    const showForm = ref(true);
    const approveDenyDesignationModal = ref(
      {} as ModalDialog<UpdateDesignationDto | boolean>,
    );
    const updateDesignationModel = ref({} as UpdateDesignationDto);
    const navigationTitle = props.institutionId
      ? "Manage designations"
      : "Pending designations";
    const routeLocation = props.institutionId
      ? {
          name: AESTRoutesConst.INSTITUTION_DESIGNATION,
          params: { institutionId: props.institutionId },
        }
      : { name: AESTRoutesConst.PENDING_DESIGNATIONS };

    const loadDesignation = async () => {
      designationAgreement.value = await DesignationAgreementService.shared.getDesignationAgreement(
        props.designationAgreementId,
      );

      designationFormModel.institutionName =
        designationAgreement.value.institutionName;
      designationFormModel.institutionType =
        designationAgreement.value.institutionType;
      designationFormModel.isBCPrivate = designationAgreement.value.isBCPrivate;
      designationFormModel.viewMode = DesignationFormViewModes.viewOnly;
      designationFormModel.designationStatus =
        designationAgreement.value.designationStatus;
      designationFormModel.designationStatusClass = mapDesignationChipStatus(
        designationAgreement.value.designationStatus,
      );
      designationFormModel.dynamicData =
        designationAgreement.value.submittedData;
      designationFormModel.locations = designationAgreement.value.locationsDesignations.map(
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
    };
    onMounted(async () => {
      await loadDesignation();
    });

    const updateDesignation = async (
      designationStatus: DesignationAgreementStatus,
    ) => {
      if (designationStatus === DesignationAgreementStatus.Approved) {
        const institutionLocations = await InstitutionService.shared.getAllInstitutionLocationSummary(
          designationAgreement.value.institutionId,
        );
        updateDesignationModel.value.locationsDesignations = institutionLocations?.map(
          location =>
            ({
              locationId: location.id,
              locationName: location.name,
              locationAddress: formatter.getFormattedAddress({
                ...location.data.address,
                provinceState: location.data.address.province,
              }),
            } as UpdateDesignationLocationDto),
        );
        updateDesignationModel.value.locationsDesignations.forEach(location => {
          const requestedDesignation = designationAgreement.value.locationsDesignations.find(
            designationLocation =>
              designationLocation.locationId === location.locationId,
          );
          if (requestedDesignation) {
            location.approved =
              requestedDesignation.approved === false ? false : true;
            location.designationLocationId =
              requestedDesignation.designationLocationId;
          }
        });
      }
      updateDesignationModel.value.startDate =
        designationAgreement.value.startDate;
      updateDesignationModel.value.endDate = designationAgreement.value.endDate;
      updateDesignationModel.value.designationStatus = designationStatus;
      updateDesignationModel.value.institutionId =
        designationAgreement.value.institutionId;
      const response = await approveDenyDesignationModal.value.showModal();
      if (response) {
        try {
          await DesignationAgreementService.shared.updateDesignationAgreement(
            props.designationAgreementId,
            response as UpdateDesignationDto,
          );
        } catch (error) {
          toast.error(
            "Unexpected error",
            "Unexpected error while approving/declining the designation.",
          );
        }
        await loadDesignation();
        toast.success(
          `Designation ${designationStatus}`,
          `The given designation has been ${designationStatus.toLowerCase()} and notes added.`,
        );
      }
    };

    return {
      designationFormModel,
      routeLocation,
      navigationTitle,
      approveDenyDesignationModal,
      showModal,
      updateDesignationModel,
      DesignationAgreementStatus,
      updateDesignation,
      showForm,
    };
  },
};
</script>
