<template>
  <modal-dialog-base :showDialog="showDialog" @dialogClosed="dialogClosed">
    <template v-slot:content>
      <v-container class="temporary-modal">
        <formio
          formName="viewRestriction"
          :data="restrictionData"
          @loaded="formLoaded"
          @submitted="submitResolution"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <check-a-e-s-t-permission-role :role="allowedRole">
        <template v-slot="{ isReadonly }">
          <footer-buttons
            primaryLabel="Resolve Restriction"
            :disablePrimaryButton="isReadonly"
            @primaryClick="resolveRestriction"
            @secondaryClick="dialogClosed"
          />
        </template>
      </check-a-e-s-t-permission-role>
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { PropType, ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { RestrictionType, Role } from "@/types";
import CheckAESTPermissionRole from "@/components/generic/CheckAESTPermissionRole.vue";

export default {
  components: { ModalDialogBase, CheckAESTPermissionRole },
  props: {
    restrictionData: {
      type: Object,
      required: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  emits: ["submitResolutionData"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const formData = ref();

    const dialogClosed = () => {
      showDialog.value = false;
    };
    const formLoaded = async (form: any) => {
      formData.value = form;
    };
    const submitForm = async () => {
      return formData.value.submit();
    };
    const submitResolution = async (data: any) => {
      context.emit("submitResolutionData", data);
    };
    const resolveRestriction = async () => {
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
      submitResolution,
      submitForm,
      RestrictionType,
      resolveRestriction,
      Role,
    };
  },
};
</script>
