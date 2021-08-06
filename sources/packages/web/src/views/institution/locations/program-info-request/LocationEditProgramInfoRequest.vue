<template>
  <h5 class="text-muted">
    <span>Edit Program Inforation Request</span>
  </h5>
  <v-sheet elevation="1" class="mx-auto">
    <v-container>
      <formio
        formName="programinformationrequest"
        :data="initialData"
        @loaded="formLoaded"
        @changed="formChanged"
        @submitted="submitted"
      ></formio>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { ProgramInfoRequestService } from "../../../../services/ProgramInfoRequestService";
import formio from "../../../../components/generic/formio.vue";
import { ref } from "vue";
import {
  useFormioUtils,
  useFormioDropdownLoader,
  useFormatters,
} from "@/composables";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

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
    const toast = useToast();
    const router = useRouter();
    const { dateString } = useFormatters();
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();

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
        );
      }
      formioUtils.redrawComponent(form, OFFERINGS_DROPDOWN_KEY);
    };

    const formLoaded = async (form: any) => {
      const programRequestData = await ProgramInfoRequestService.shared.getProgramInfoRequest(
        props.locationId,
        props.applicationId,
      );

      initialData.value = {
        ...programRequestData,
        studentStudyStartDate: dateString(
          programRequestData.studentStudyStartDate,
        ),
        studentStudyEndDate: dateString(programRequestData.studentStudyEndDate),
      };

      // While loading a PIR that is in the 'completed' status
      // the editable area of the form should be disabled.
      if (programRequestData.pirStatus.toLowerCase() === "completed") {
        const institutionEnteredDetails = formioUtils.getComponent(
          form,
          INSTITUTION_DETAILS_PANEL,
        );
        institutionEnteredDetails.disabled = true;
      }

      await formioDataLoader.loadProgramsForLocationForInstitution(
        form,
        props.locationId,
        PROGRAMS_DROPDOWN_KEY,
      );

      await loadOfferingsForProgram(form);
    };

    const formChanged = async (form: any, event: any) => {
      if (event.changed?.component?.key === PROGRAMS_DROPDOWN_KEY) {
        await loadOfferingsForProgram(form);
      }
    };

    const submitted = async (data: any) => {
      try {
        ProgramInfoRequestService.shared.completeProgramInfoRequest(
          props.locationId,
          props.applicationId,
          data,
        );
        toast.add({
          severity: "success",
          summary: "Completed!",
          detail: "Program Information Request completed successfully!",
          life: 5000,
        });
        router.push({
          name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
        });
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail:
            "An error happened while saving the Program Information Request.",
          life: 5000,
        });
      }
    };

    return {
      initialData,
      formLoaded,
      formChanged,
      submitted,
    };
  },
};
</script>
