<template>
  <ModalDialogBase :showDialog="showDialog" @dialogClosed="dialogClosed">
    <template v-slot:content>
      <v-container class="restriction-modal">
        <formio
          formName="addrestriction"
          @loaded="formLoaded"
          @changed="formChanged"
          @submitted="submitRestriction"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> Cancel </v-btn>
      <v-btn
        @click="addRestriction()"
        class="float-right primary-btn-background"
      >
        Add Restriction
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import { ref } from "vue";
import formio from "@/components/generic/formio.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { RestrictionService } from "@/services/RestrictionService";
import {
  useModalDialog,
  useFormioUtils,
  useFormioDropdownLoader,
} from "@/composables";
import { AddStudentRestrictionDTO } from "@/types";
export default {
  components: { ModalDialogBase, formio },
  props: {
    studentRestriction: {
      type: Object,
      required: true,
    },
  },
  emits: ["submitRestrictionData"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const formData = ref();
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();

    const dialogClosed = () => {
      showDialog.value = false;
    };
    const formLoaded = async (form: any) => {
      formData.value = form;
      const dropdown = formioUtils.getComponent(form, "category");
      const categories = await RestrictionService.shared.getRestrictionCategories();
      const options = [];
      for (const category of categories) {
        options.push({
          label: category.description,
          value: category.description,
        });
      }
      dropdown.component.data.values = options;
      dropdown.redraw();
    };

    const formChanged = async (form: any, event: any) => {
      if (event.changed?.component.key === "category") {
        form.data.restriction = undefined;
        const selectedRestrictionCategory: string = formioUtils.getComponentValueByKey(
          form,
          "category",
        );
        formioDataLoader.loadRestrictionReasons(
          form,
          "restriction",
          selectedRestrictionCategory,
        );
      }
    };
    const submitForm = async () => {
      return formData.value.submit();
    };
    const submitRestriction = async (data: AddStudentRestrictionDTO) => {
      context.emit("submitRestrictionData", data);
    };
    const addRestriction = async () => {
      const formSubmitted = await submitForm();
      if (formSubmitted) {
        showDialog.value = false;
      }
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      formLoaded,
      submitRestriction,
      submitForm,
      addRestriction,
      formChanged,
    };
  },
};
</script>
