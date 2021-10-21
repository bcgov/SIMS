<template>
  <full-page-container>
    <formio
      formName="supportingusersdashboard"
      @customEvent="customEventCallback"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { useRouter } from "vue-router";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
export default {
  components: {
    formio,
    FullPageContainer,
  },
  setup() {
    const router = useRouter();
    const customEventCallback = async (
      _form: any,
      event: FormIOCustomEvent,
    ) => {
      let routeName: symbol;
      switch (event.type) {
        case FormIOCustomEventTypes.RouteToParentInformation:
          routeName = SupportingUserRoutesConst.PARENT_INFORMATION;
          break;
        case FormIOCustomEventTypes.RouteToPartnerInformation:
          routeName = SupportingUserRoutesConst.PARTNER_INFORMATION;
          break;
        default:
          throw new Error("Invalid route value");
      }
      router.push({ name: routeName });
    };

    return { customEventCallback };
  },
};
</script>
