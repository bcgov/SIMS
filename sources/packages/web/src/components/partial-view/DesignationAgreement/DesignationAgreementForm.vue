<template>
  <formio-container
    formName="designationAgreementDetails"
    :formData="model"
    :readOnly="viewOnly"
    @submitted="submitDesignation"
    @render="formRender"
  >
    <template #actions="{ submit }" v-if="!viewOnly">
      <footer-buttons
        :processing="processing"
        primaryLabel="Submit"
        @primaryClick="submit()"
        @secondaryClick="cancel"
      /> </template
  ></formio-container>
</template>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteHelper } from "@/helpers";
import { DesignationModel } from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";

export default defineComponent({
  emits: ["submitDesignation", "cancel"],
  props: {
    model: {
      type: Object as PropType<DesignationModel>,
      required: true,
    },
    viewOnly: {
      type: Boolean,
      required: false,
    },
    processing: {
      type: Boolean,
      required: false,
    },
  },
  setup(_props, context) {
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

    const cancel = () => {
      context.emit("cancel");
    };

    return { formRender, submitDesignation, cancel };
  },
});
</script>
