<template>
  <div class="p-m-4">
    <header-navigator
      :title="navigationTitle"
      subTitle="View designation agreement"
      :routeLocation="routeLocation"
    >
      <template #buttons>
        <v-row class="p-0 m-0">
          <v-btn
            v-if="showActionButtons"
            color="primary"
            variant="outlined"
            data-cy="declinedDesignationAgreementButton"
            @click="updateDesignation(DesignationAgreementStatus.Declined)"
            >Decline</v-btn
          >
          <v-btn
            class="ml-2 primary-btn-background"
            v-if="showActionButtons"
            data-cy="approvedDesignationAgreementButton"
            @click="updateDesignation(DesignationAgreementStatus.Approved)"
            >Approve designation</v-btn
          >
        </v-row>
      </template>
    </header-navigator>
    <full-page-container class="mt-4">
      <!-- Form.io is not reactively binding the property readOnly. Hence loading the form only after API call is completed. -->
      <!-- If the readOnly value change after DOM(form) is mounted, form does not respond to it.  -->
      <designation-agreement-form
        v-if="modelLoaded"
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
import { onMounted, reactive, ref, computed } from "vue";
import {
  useFormatters,
  useDesignationAgreement,
  ModalDialog,
  useSnackBar,
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
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApproveDenyDesignation from "@/views/aest/institution/ApproveDenyDesignation.vue";

export default {
  components: {
    DesignationAgreementForm,
    ApproveDenyDesignation,
  },
  props: {
    designationId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const formatter = useFormatters();
    const { mapDesignationChipStatus } = useDesignationAgreement();
    const designationAgreement = ref({} as GetDesignationAgreementDto);
    const designationFormModel = reactive({} as DesignationModel);
    const toast = useSnackBar();
    const showActionButtons = computed(
      () =>
        designationFormModel.designationStatus !==
        DesignationAgreementStatus.Declined,
    );
    const approveDenyDesignationModal = ref(
      {} as ModalDialog<UpdateDesignationDto | boolean>,
    );
    const updateDesignationModel = ref({} as UpdateDesignationDto);
    const routeLocation = computed(() =>
      props.institutionId
        ? {
            name: AESTRoutesConst.INSTITUTION_DESIGNATION,
            params: { institutionId: props.institutionId },
          }
        : { name: AESTRoutesConst.PENDING_DESIGNATIONS },
    );
    const navigationTitle = computed(() =>
      props.institutionId ? "Manage designations" : "Pending designations",
    );
    const modelLoaded = ref(false);

    const loadDesignation = async () => {
      designationAgreement.value =
        await DesignationAgreementService.shared.getDesignationAgreement(
          props.designationId,
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
      designationFormModel.locations =
        designationAgreement.value.locationsDesignations.map((location) => ({
          locationId: location.locationId,
          locationName: location.locationName,
          requestForDesignation: location.requested,
          approvedForDesignation: location.approved,
          locationAddress: formatter.getFormattedAddress(
            location.locationData.address,
          ),
        }));
      modelLoaded.value = true;
    };
    onMounted(async () => {
      await loadDesignation();
    });

    const updateDesignation = async (
      designationStatus: DesignationAgreementStatus,
    ) => {
      updateDesignationModel.value.designationStatus = designationStatus;
      if (designationStatus === DesignationAgreementStatus.Approved) {
        /*If the update action is Approval, build the designation location array for form
          by merging the institution locations list with designation locations list
        */
        const institutionLocations =
          await InstitutionService.shared.getAllInstitutionLocations(
            designationAgreement.value.institutionId,
          );
        //On re-approval of same designation start date and end date should be preloaded.
        updateDesignationModel.value.startDate =
          designationAgreement.value.startDate;
        updateDesignationModel.value.endDate =
          designationAgreement.value.endDate;

        updateDesignationModel.value.locationsDesignations =
          institutionLocations?.map((institutionLocation) => {
            const designationLocation = {} as UpdateDesignationLocationDto;
            designationLocation.locationId = institutionLocation.id;
            designationLocation.locationName = institutionLocation.name;
            designationLocation.locationAddress = formatter.getFormattedAddress(
              institutionLocation.data.address,
            );
            const existingDesignationLocation =
              designationAgreement.value.locationsDesignations.find(
                (item) => item.locationId === institutionLocation.id,
              );
            if (existingDesignationLocation) {
              designationLocation.approved =
                existingDesignationLocation.approved !== false;
              designationLocation.existingDesignationLocation = true;
            }
            return designationLocation;
          });
      }
      const response = await approveDenyDesignationModal.value.showModal();
      //Update designation only on a submit action.
      if (response) {
        try {
          await DesignationAgreementService.shared.updateDesignationAgreement(
            props.designationId,
            response as UpdateDesignationDto,
          );

          toast.success(
            `The given designation has been ${designationStatus.toLowerCase()} and notes added.`,
          );
          await loadDesignation();
        } catch (error) {
          toast.error(
            "Unexpected error while approving/declining the designation.",
          );
        }
      }
      //If cancel click from approval modal, Update data must be cleared.
      updateDesignationModel.value = {} as UpdateDesignationDto;
    };

    return {
      designationFormModel,
      routeLocation,
      navigationTitle,
      approveDenyDesignationModal,
      updateDesignationModel,
      DesignationAgreementStatus,
      updateDesignation,
      showActionButtons,
      modelLoaded,
    };
  },
};
</script>
