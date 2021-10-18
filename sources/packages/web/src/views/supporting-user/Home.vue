<template>
  <v-container>
    <v-card class="p-4">
      <formio
        formName="supportingusersdashboard"
        @customEvent="customEventCallback"
      ></formio>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { useRouter } from "vue-router";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
export default {
  components: {
    formio,
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
          routeName = SupportingUserRoutesConst.PARENT_INFORMATION;
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
