<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="getRouteLocation()"
        :subTitle="subTitle"
      >
        <template #buttons>
          <v-row class="p-0 m-0">
            <v-btn
              v-if="showActionButtons"
              color="primary"
              variant="outlined"
              @click="assessOffering(OfferingStatus.Declined)"
              >Decline</v-btn
            >
            <v-btn
              class="ml-2"
              color="primary"
              v-if="showActionButtons"
              @click="assessOffering(OfferingStatus.Approved)"
              >Approve offering</v-btn
            >
            <v-menu v-if="hasExistingApplication">
              <template v-slot:activator="{ props }">
                <v-btn
                  class="ml-2"
                  color="primary"
                  prepend-icon="fa:fa fa-chevron-circle-down"
                  v-bind="props"
                  >Edit Actions</v-btn
                >
              </template>
              <v-list>
                <template v-for="(item, index) in items" :key="index">
                  <v-list-item :value="index">
                    <v-list-item-title @click="item.command">
                      <span class="label-bold">{{ item.label }}</span>
                    </v-list-item-title>
                  </v-list-item>
                  <v-divider
                    v-if="index < items.length - 1"
                    :key="index"
                    inset
                  ></v-divider>
                </template>
              </v-list>
            </v-menu>
          </v-row>
        </template>
      </header-navigator>
      <program-offering-detail-header
        v-if="offeringId"
        class="m-4"
        :headerDetails="{
          ...initialData,
          status: initialData.offeringStatus,
          institutionId: institutionId,
        }"
      />
    </template>
    <template #alerts>
      <banner
        v-if="hasExistingApplication"
        class="mb-2"
        :type="BannerTypes.Success"
        header="Students have applied financial aid for this offering"
        summary="You can still make changes to the name. If you need edit the locked fields, please click on the edit actions menu and request to edit."
      />
    </template>
    <assess-offering-modal
      ref="assessOfferingModalRef"
      :offeringStatus="offeringApprovalStatus"
    />
    <formio
      formName="educationprogramoffering"
      :data="initialData"
      @submitted="submitted"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter, RouteLocationRaw } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import {
  ClientIdType,
  OfferingFormModel,
  OfferingStatus,
  ProgramValidationModel,
} from "@/types";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { useSnackBar, useOffering, ModalDialog } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import AssessOfferingModal from "@/components/aest/institution/modals/AssessOfferingModal.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    AssessOfferingModal,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  //Todo: Change the initialData to a well defined contract.
  setup(props: any) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const items = [
      {
        label: "Request Change",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.OFFERING_REQUEST_CHANGE,
            params: {
              programId: props.programId,
              offeringId: props.offeringId,
              locationId: props.locationId,
            },
          });
        },
      },
    ];
    const initialData = ref(
      {} as Partial<OfferingFormModel & ProgramValidationModel>,
    );
    const { mapOfferingChipStatus } = useOffering();
    const clientType = computed(() => AuthService.shared.authClientType);
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );
    const offeringApprovalStatus = ref(OfferingStatus.Declined);
    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const isReadonly = computed(() => {
      return isAESTUser.value;
    });
    const showActionButtons = computed(
      () =>
        initialData.value.offeringStatus === OfferingStatus.Pending &&
        isAESTUser.value,
    );
    const subTitle = computed(() => {
      if (isReadonly.value) {
        return "View Study Period";
      }
      if (props.offeringId && !isReadonly.value) {
        return "Edit Study Period";
      }
      return "Add Study Period";
    });
    const hasExistingApplication = computed(
      () =>
        initialData.value.hasExistingApplication &&
        isInstitutionUser.value &&
        initialData.value.offeringStatus === OfferingStatus.Approved,
    );

    const loadFormData = async () => {
      if (isInstitutionUser.value) {
        const programDetails =
          await EducationProgramService.shared.getEducationProgram(
            props.programId,
          );
        const programValidationDetails = {
          programIntensity: programDetails.programIntensity,
          programDeliveryTypes: programDetails.programDeliveryTypes,
          hasWILComponent: programDetails.hasWILComponent,
        };
        if (props.offeringId) {
          const programOffering =
            await EducationProgramOfferingService.shared.getProgramOffering(
              props.locationId,
              props.programId,
              props.offeringId,
            );
          initialData.value = {
            ...programOffering,
            ...programValidationDetails,
          };
          initialData.value.offeringChipStatus = mapOfferingChipStatus(
            programOffering.offeringStatus,
          );
          initialData.value.offeringStatusToDisplay =
            programOffering.offeringStatus;
        } else {
          initialData.value = {
            ...programValidationDetails,
          };
        }
      }
      if (isAESTUser.value) {
        if (props.offeringId) {
          const programOfferingPromise =
            EducationProgramOfferingService.shared.getProgramOfferingForAEST(
              props.offeringId,
            );
          const programDetailsPromise =
            EducationProgramService.shared.getEducationProgram(props.programId);
          const [programOffering, programDetails] = await Promise.all([
            programOfferingPromise,
            programDetailsPromise,
          ]);
          const programValidationDetails = {
            programIntensity: programDetails.programIntensity,
            programDeliveryTypes: programDetails.programDeliveryTypes,
            hasWILComponent: programDetails.hasWILComponent,
          };
          initialData.value = {
            ...programOffering,
            ...programValidationDetails,
          };
          initialData.value.offeringChipStatus = mapOfferingChipStatus(
            programOffering.offeringStatus,
          );
          initialData.value.offeringStatusToDisplay =
            programOffering.offeringStatus;
        }
      }
      /**
       * The property clientType is populated for institution because
       * the form.io for education program offering has a logic at it's root level panel
       * to disable all the form inputs when clientType is not institution.
       * The above mentioned logic is added to the panel of the form to display the
       * form as read-only for ministry(AEST) user and also allow the hidden component values
       * to be calculated.
       *! If a form.io is loaded with readOnly attribute set to true, then the restricts
       *! hidden components to calculate it's value by design.
       */
      initialData.value.clientType = AuthService.shared.authClientType;
    };
    onMounted(async () => {
      await loadFormData();
    });

    const getRouteLocation = (): RouteLocationRaw => {
      if (isInstitutionUser.value) {
        // when edit program and create program
        return {
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        };
      }
      if (isAESTUser.value) {
        return {
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: props.institutionId,
            locationId: props.locationId,
          },
        };
      }
      return {};
    };
    const submitted = async (data: any) => {
      if (isInstitutionUser.value) {
        try {
          if (props.offeringId) {
            await EducationProgramOfferingService.shared.updateProgramOffering(
              props.locationId,
              props.programId,
              props.offeringId,
              data,
            );
            snackBar.success("Education Offering updated successfully!");
          } else {
            await EducationProgramOfferingService.shared.createProgramOffering(
              props.locationId,
              props.programId,
              data,
            );
            snackBar.success("Education Offering created successfully!");
          }
          router.push(getRouteLocation());
        } catch (excp) {
          snackBar.error(
            "An error happened during the Offering saving process.",
          );
        }
      }
    };

    const assessOffering = async (offeringStatus: OfferingStatus) => {
      offeringApprovalStatus.value = offeringStatus;
      const responseData = await assessOfferingModalRef.value.showModal();
      if (responseData) {
        try {
          await EducationProgramOfferingService.shared.assessOffering(
            props.offeringId,
            responseData as OfferingAssessmentAPIInDTO,
          );
          snackBar.success(
            `The given offering has been ${offeringStatus.toLowerCase()} and notes added.`,
          );
          await loadFormData();
        } catch (error) {
          snackBar.error(
            "Unexpected error while approving/declining the offering.",
          );
        }
      }
    };

    return {
      submitted,
      initialData,
      isReadonly,
      getRouteLocation,
      InstitutionRoutesConst,
      subTitle,
      showActionButtons,
      assessOffering,
      OfferingStatus,
      assessOfferingModalRef,
      offeringApprovalStatus,
      BannerTypes,
      hasExistingApplication,
      items,
    };
  },
};
</script>
