<template>
  <v-sheet elevation="1" class="mx-auto">
    <v-container>
      <formio
        formName="studentapplication"
        :data="initialData"
        @loaded="formLoaded"
        @submitted="submitted"
        @customEvent="customEventCallback"
      ></formio>
    </v-container>
  </v-sheet>
</template>
<script lang="ts">
import { SetupContext, ref } from "vue";
import formio from "../../../components/generic/formio.vue";
import { useFormioDropdownLoader } from "@/composables";

export default {
  components: { formio },
  setup(props: any) {
    const initialData = ref({});
    const formioDataLoader = useFormioDropdownLoader();
    const PROGRAM_YEAR_DROPDOWN_KEY = "programYear";

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadProgramYear(form, PROGRAM_YEAR_DROPDOWN_KEY);
    };

    return {
      initialData,
      formLoaded,
    };
  },
};
</script>
