<template>
  <full-page-container layout-template="centered-card-tab">
    <template #header>
      <header-navigator
        :title="navigationTitle"
        subTitle="View designation agreement"
        :routeLocation="routeLocation"
      >
        <template #buttons>
          <check-permission-role
            :role="Role.InstitutionApproveDeclineDesignation"
          >
            <template #="{ notAllowed }">
              <v-btn
                v-if="showActionButtons"
                color="primary"
                variant="outlined"
                data-cy="declinedDesignationAgreementButton"
                :disabled="notAllowed"
                @click="updateDesignation(DesignationAgreementStatus.Declined)"
                >Decline</v-btn
              >
              <v-btn
                class="ml-2"
                color="primary"
                :disabled="notAllowed"
                v-if="showActionButtons"
                data-cy="approvedDesignationAgreementButton"
                @click="updateDesignation(DesignationAgreementStatus.Approved)"
                >Approve designation</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </header-navigator>
    </template>

    <designation-agreement-form
      :model="designationFormModel"
      :view-only="true"
    ></designation-agreement-form>

    <approve-deny-designation-modal
      ref="approveDenyDesignationModal"
      :designation="updateDesignationModel"
      :processing="processing"
    />
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, computed, defineComponent } from "vue";
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
  DesignationAgreementStatus,
  DesignationAgreementAPIOutDTO,
} from "@/services/http/dto";
import {
  DesignationModel,
  DesignationFormViewModes,
  UpdateDesignationDetailsModel,
  UpdateDesignationLocationsListItem,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role } from "@/types";
import ApproveDenyDesignationModal from "@/components/aest/institution/modals/ApproveDenyDesignationModal.vue";

export default defineComponent({
  components: {
    DesignationAgreementForm,
    CheckPermissionRole,
    ApproveDenyDesignationModal,
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
  setup(props) {
    const formatter = useFormatters();
    const { mapDesignationChipStatus } = useDesignationAgreement();
    const designationAgreement = ref({} as DesignationAgreementAPIOutDTO);
    const designationFormModel = ref({} as DesignationModel);
    const processing = ref(false);
    const snackBar = useSnackBar();

    const showActionButtons = computed(
      () =>
        designationFormModel.value.designationStatus !==
        DesignationAgreementStatus.Declined,
    );

    const approveDenyDesignationModal = ref(
      {} as ModalDialog<UpdateDesignationDetailsModel | boolean>,
    );

    const updateDesignationModel = ref({} as UpdateDesignationDetailsModel);

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

    const loadDesignation = async () => {
      designationAgreement.value =
        await DesignationAgreementService.shared.getDesignationAgreement(
          props.designationId,
        );
      designationFormModel.value = {
        ...designationAgreement.value,
        viewMode: DesignationFormViewModes.viewOnly,
        designationStatusClass: mapDesignationChipStatus(
          designationAgreement.value.designationStatus,
        ),
        disableLinkNavigation: true,
        dynamicData: designationAgreement.value.submittedData,
        locations: designationAgreement.value.locationsDesignations.map(
          (location) => ({
            locationId: location.locationId,
            locationName: location.locationName,
            requestForDesignation: location.requested,
            approvedForDesignation: location.approved,
            locationAddress: formatter.getFormattedAddress(
              location.locationData.address,
            ),
          }),
        ),
      };
      designationFormModel.value.viewMode = DesignationFormViewModes.viewOnly;
    };

    onMounted(loadDesignation);

    const updateDesignation = async (
      designationStatus: DesignationAgreementStatus,
    ) => {
      updateDesignationModel.value.designationStatus = designationStatus;
      if (designationStatus === DesignationAgreementStatus.Approved) {
        // If the update action is Approval, build the designation location array for form
        // by merging the institution locations list with designation locations list
        const institutionLocations =
          await InstitutionService.shared.getAllInstitutionLocations(
            designationAgreement.value.institutionId,
          );
        // On re-approval of same designation start date and end date should be preloaded.
        updateDesignationModel.value.startDate =
          designationAgreement.value.startDate;
        updateDesignationModel.value.endDate =
          designationAgreement.value.endDate;

        updateDesignationModel.value.locationsDesignations =
          institutionLocations?.map((institutionLocation) => {
            const designationLocation =
              {} as UpdateDesignationLocationsListItem;
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
      const response = await approveDenyDesignationModal.value.showModal(
        updateDesignationModel.value,
      );
      // Update designation only on a submit action.
      if (response) {
        try {
          processing.value = true;
          await DesignationAgreementService.shared.updateDesignationAgreement(
            props.designationId,
            response as UpdateDesignationDetailsModel,
          );
          snackBar.success(
            `The given designation has been ${designationStatus.toLowerCase()} and notes added.`,
          );
          await loadDesignation();
        } catch {
          snackBar.error(
            "Unexpected error while approving/declining the designation.",
          );
        } finally {
          processing.value = false;
        }
      }
      // If cancel click from approval modal, Update data must be cleared.
      updateDesignationModel.value = {} as UpdateDesignationDetailsModel;
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
      Role,
      processing,
    };
  },
});
</script>
