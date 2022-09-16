<template>
  <formio-container
    formName="designationAgreementDetails"
    :formData="model"
    :readOnly="readOnly"
    @submitted="submitDesignation"
    @render="formRender"
  >
    <template #actions="{ submit }" v-if="!(viewOnly || hideFooter)">
      <footer-buttons
        :processing="processing"
        primaryLabel="Submit"
        @primaryClick="submit()"
        @secondaryClick="cancel"
      /> </template
  ></formio-container>
</template>

<script lang="ts">
import { SetupContext, computed } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteHelper } from "@/helpers";
import {
  DesignationModel,
  DesignationFormViewModes,
} from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";

export default {
  emits: ["submitDesignation", "cancel"],
  props: {
    model: {
      type: Object,
      required: true,
    },
    viewOnly: {
      type: Boolean,
      required: false,
    },
    hideFooter: {
      type: Boolean,
      required: false,
    },
  },
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    // Regular hyperlinks ids presents inside the form.io definition that
    // needs execute a redirect in the vue application.
    const MANAGE_LOCATIONS_LINK = "goToManageLocations";
    const MANAGE_USERS_LINK = "goToManageUsers";

    const formRender = () => {
      RouteHelper.AssociateHyperlinkClick(MANAGE_LOCATIONS_LINK, () =>
        router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS }),
      );
      RouteHelper.AssociateHyperlinkClick(MANAGE_USERS_LINK, () =>
        router.push({ name: InstitutionRoutesConst.MANAGE_USERS }),
      );
    };

    const submitDesignation = async (model: DesignationModel) => {
      context.emit("submitDesignation", model);
    };

    const readOnly = computed(() => {
      return props.model.viewMode === DesignationFormViewModes.viewOnly;
    });

    const cancel = () => {
      context.emit("cancel");
    };

    return { formRender, submitDesignation, readOnly, cancel };
  },
};
</script>
