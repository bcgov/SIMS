<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="routeLocation"
        subTitle="Add offering"
      />
    </template>
    <offering-form-submit
      submitLabel="Add offering now"
      :formMode="OfferingFormModes.Editable"
      :processing="processing"
      :locationId="locationId"
      :programId="programId"
      @saved="goBack"
      @cancel="goBack"
    ></offering-form-submit>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, computed, defineComponent } from "vue";
import { OfferingFormModes, OfferingStatus } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import OfferingFormSubmit from "@/components/common/OfferingFormSubmit.vue";
import { BannerTypes } from "@/types/contracts/Banner";

export default defineComponent({
  components: {
    OfferingFormSubmit,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const processing = ref(false);

    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
      },
    }));

    const goBack = () => {
      router.push(routeLocation.value);
    };

    return {
      InstitutionRoutesConst,
      OfferingStatus,
      BannerTypes,
      routeLocation,
      processing,
      goBack,
      OfferingFormModes,
    };
  },
});
</script>
