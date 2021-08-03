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
import { onMounted, ref } from "vue";
import { useFormioUtils, useFormioDropdownLoader } from "@/composables";

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
    const initialData = ref({});
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();

    // onMounted(async () => {
    //   const programRequestData = await ProgramInfoRequestService.shared.getProgramInfoRequest(
    //     props.locationId,
    //     props.applicationId,
    //   );
    //   console.log(programRequestData);
    //   initialData.value = programRequestData;
    // });

    const submitted = async (data: any) => {
      console.log(data);
    };

    // Components names on Form.IO definition that will be manipulated.
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";

    const formLoaded = async (form: any) => {
      const programRequestData = await ProgramInfoRequestService.shared.getProgramInfoRequest(
        props.locationId,
        props.applicationId,
      );
      initialData.value = programRequestData;

      await formioDataLoader.loadProgramsForLocationForInstitution(
        form,
        props.locationId,
        PROGRAMS_DROPDOWN_KEY,
      );

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
    };

    const formChanged = async (form: any, event: any) => {
      console.log(event);
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
