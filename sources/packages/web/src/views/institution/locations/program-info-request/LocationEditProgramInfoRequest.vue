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
//import { useRouter } from "vue-router";
//import { useToast } from "primevue/usetoast";
import { ProgramInfoRequestService } from "../../../../services/ProgramInfoRequestService";
import formio from "../../../../components/generic/formio.vue";
import { ref } from "vue";
import {
  useFormioUtils,
  useFormioDropdownLoader,
  useFormatters,
} from "@/composables";

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
    //const toast = useToast();
    //const router = useRouter();
    // Data-bind
    const { dateString } = useFormatters();
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();

    const submitted = async (data: any) => {
      ProgramInfoRequestService.shared.completeProgramInfoRequest(
        props.locationId,
        props.applicationId,
        data,
      );
    };

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

    return {
      initialData,
      formLoaded,
      formChanged,
      submitted,
    };
  },
};
</script>
