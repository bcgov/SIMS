<template>
  <formio
    formName="designationagreementdetails"
    :data="model"
    :readOnly="readOnly"
    @submitted="submitDesignation"
    @loaded="formLoaded"
  ></formio>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { SetupContext, computed } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteHelper } from "@/helpers";

/**
 * Used do define conditions to change the form.io, for instance,
 * some components visibility.
 */
export enum DesignationFormViewModes {
  submission = "submission",
  viewOnly = "viewOnly",
}

/**
 * Locations list that will be displayed to the
 * user mark the required locations to be designated
 * and also display the approved ones when the
 * form is in viewOnly mode.
 */
export interface DesignationLocationsListItem {
  locationId: number;
  locationName: string;
  locationAddress: string;
  requestForDesignation: boolean;
}

export interface DesignationModel {
  institutionName: string;
  institutionType: string;
  locations: DesignationLocationsListItem[];
  // The form will contain more dynamic data that what
  // is declared below. The declared data is part of the
  // dynamic but it need be provided to the form when the
  // form is in submission mode.
  dynamicData: {
    legalAuthorityName: string;
    legalAuthorityEmailAddress: string;
  };
  viewMode: DesignationFormViewModes;
  // Non BC Privates will have less information
  // displayed on the form.
  isBCPrivate: boolean;
}

export default {
  emits: ["submitDesignation"],
  components: { formio },
  props: {
    model: {
      type: Object,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    // Regular hyperlinks ids presents inside the form.io definition that
    // needs execute a redirect in the vue application.
    const MANAGE_LOCATIONS_LINK = "goToManageLocations";
    const MANAGE_USERS_LINK = "goToManageUsers";

    const formLoaded = async () => {
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

    return { formLoaded, submitDesignation, readOnly };
  },
};
</script>
