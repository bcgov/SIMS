<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="getRouteLocation()"
        subTitle="Request to Change"
      />
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
        class="mb-2"
        :type="BannerTypes.Warning"
        header="You're requesting a change when students have applied financial aid for this offering"
        summary="Please be advised if the request is approved, the students who applied for financial aid for this offering will go through a reassessment and it may change their funding amount."
      />
    </template>
    <assess-offering-modal
      ref="assessOfferingModalRef"
      :offeringStatus="offeringApprovalStatus"
    />
    <offering-form
      :data="initialData"
      @saveOffering="saveOffering"
    ></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter, RouteLocationRaw } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref } from "vue";
import {
  OfferingFormModel,
  OfferingStatus,
  ProgramValidationModel,
  OfferingDTO,
} from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useToastMessage, useOffering } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingForm from "@/components/institutions/offerings/OfferingForm.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingForm,
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
  },

  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const initialData = ref(
      {} as Partial<OfferingFormModel & ProgramValidationModel>,
    );
    const { mapOfferingChipStatus } = useOffering();

    const loadFormData = async () => {
      const programDetails = await EducationProgramService.shared.getProgram(
        props.programId,
      );
      const programValidationDetails = {
        programIntensity: programDetails.programIntensity,
        programDeliveryTypes: programDetails.programDeliveryTypes,
        hasWILComponent: programDetails.hasWILComponent,
      };
      const programOffering =
        await EducationProgramOfferingService.shared.getProgramOffering(
          props.locationId,
          props.programId,
          props.offeringId,
        );
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
      initialData.value = {
        ...programOffering,
        ...programValidationDetails,
        offeringChipStatus: mapOfferingChipStatus(
          programOffering.offeringStatus,
        ),
        offeringStatusToDisplay: programOffering.offeringStatus,
        clientType: AuthService.shared.authClientType,
        hasExistingApplication: false,
      };
    };
    onMounted(async () => {
      await loadFormData();
    });

    const getRouteLocation = (): RouteLocationRaw => {
      return {
        name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
        params: {
          programId: props.programId,
          locationId: props.locationId,
          offeringId: props.offeringId,
        },
      };
    };
    const saveOffering = async (data: OfferingDTO) => {
      try {
        await EducationProgramOfferingService.shared.requestChange(
          props.locationId,
          props.programId,
          props.offeringId,
          data,
        );
        toast.success(
          "Offering Updated",
          "Request for change has been submitted.",
        );
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } catch (error: unknown) {
        toast.error(
          "Unexpected error",
          "An error happened while requesting a change to the offering.",
        );
      }
    };
    return {
      saveOffering,
      initialData,
      getRouteLocation,
      OfferingStatus,
      BannerTypes,
    };
  },
};
</script>
