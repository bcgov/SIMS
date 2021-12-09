<template>
  <h5 class="text-muted">
    <span>Edit Program Information Request</span>
  </h5>
  <v-sheet elevation="1" class="mx-auto">
    <v-container>
      <formio
        formName="programinformationrequest"
        :data="initialData"
        @loaded="formLoaded"
        @changed="formChanged"
        @submitted="submitted"
        @customEvent="customEventCallback"
      ></formio>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ProgramInfoRequestService } from "../../../../services/ProgramInfoRequestService";
import formio from "../../../../components/generic/formio.vue";
import { ref } from "vue";
import {
  useFormioUtils,
  useFormioDropdownLoader,
  useFormatters,
  useToastMessage,
} from "@/composables";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";

export default {
  components: { formio },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const { dateString } = useFormatters();
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const programRequestData = ref();

    // Components names on Form.IO definition that will be manipulated.
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const INSTITUTION_DETAILS_PANEL = "institutionEnteredDetails";

    const loadOfferingsForProgram = async (form: any) => {
      const programId = formioUtils.getComponentValueByKey(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );

      if (programId) {
        await formioDataLoader.loadOfferingsForLocationForInstitution(
          form,
          programId,
          props.locationId,
          OFFERINGS_DROPDOWN_KEY,
          programRequestData.value.programYearId,
        );
      }
      formioUtils.redrawComponent(form, OFFERINGS_DROPDOWN_KEY);
    };

    const formLoaded = async (form: any) => {
      programRequestData.value = await ProgramInfoRequestService.shared.getProgramInfoRequest(
        props.locationId,
        props.applicationId,
      );

      initialData.value = {
        ...programRequestData.value,
        studentStudyStartDate: dateString(
          programRequestData.value.studentStudyStartDate,
        ),
        studentStudyEndDate: dateString(
          programRequestData.value.studentStudyEndDate,
        ),
      };

      // While loading a PIR that is in the some readonly status
      // the editable area of the form should be disabled.
      const readonlyStatus = ["submitted", "completed", "declined"];
      if (
        readonlyStatus.includes(
          programRequestData.value.pirStatus.toLowerCase(),
        )
      ) {
        const institutionEnteredDetails = formioUtils.getComponent(
          form,
          INSTITUTION_DETAILS_PANEL,
        );
        institutionEnteredDetails.disabled = true;
      }

      await formioDataLoader.loadProgramsForInstitution(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );

      await loadOfferingsForProgram(form);
    };

    const formChanged = async (form: any, event: any) => {
      if (event.changed?.component?.key === PROGRAMS_DROPDOWN_KEY) {
        await loadOfferingsForProgram(form);
      }
      await formioDataLoader.loadPIRDeniedReasonList(form, "pirDenyReasonId");
    };

    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      if (FormIOCustomEventTypes.RouteToCreateProgram === event.type) {
        router.push({
          name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        });
      }
    };

    const submitted = async (data: any) => {
      try {
        if (data.denyProgramInformationRequest) {
          await ProgramInfoRequestService.shared.denyProgramInfoRequest(
            props.locationId,
            props.applicationId,
            data,
          );
          toast.success(
            "Denied!",
            "Program Information Request denied successfully!",
          );
        } else {
          await ProgramInfoRequestService.shared.completeProgramInfoRequest(
            props.locationId,
            props.applicationId,
            data,
          );
          toast.success(
            "Completed!",
            "Program Information Request completed successfully!",
          );
        }
        router.push({
          name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while saving the Program Information Request.",
        );
      }
    };
    return {
      initialData,
      formLoaded,
      formChanged,
      submitted,
      customEventCallback,
    };
  },
};
</script>
