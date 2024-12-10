<template>
  <full-page-container>
    <formio-container
      formName="supportingusersdashboard"
      @customEvent="customEventCallback"
      :formData="formData"
    ></formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { useRouter } from "vue-router";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import { AppConfigService } from "@/services/AppConfigService";
export default defineComponent({
  setup() {
    const formData: { isFulltimeAllowed: boolean } = {
      isFulltimeAllowed: false,
    };
    const router = useRouter();
    onMounted(async () => {
      const { isFulltimeAllowed } = await AppConfigService.shared.config();
      formData.isFulltimeAllowed = isFulltimeAllowed;
    });
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

    return { customEventCallback, formData };
  },
});
</script>
