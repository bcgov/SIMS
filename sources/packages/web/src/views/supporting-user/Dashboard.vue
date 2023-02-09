<template>
  <full-page-container>
    <formio-container
      formName="supportingusersdashboard"
      @customEvent="customEventCallback"
    ></formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { useRouter } from "vue-router";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
export default defineComponent({
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
});
</script>
