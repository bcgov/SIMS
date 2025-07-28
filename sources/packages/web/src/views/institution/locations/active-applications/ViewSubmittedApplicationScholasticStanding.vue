<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Report a change"
        subTitle="View Application"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <scholastic-standing-form
      :readOnly="true"
      :showFooter="true"
      :showCompleteInfo="true"
      :scholasticStandingId="scholasticStandingId"
    />
  </full-page-container>
</template>
<script lang="ts">
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import { computed, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteLocationRaw } from "vue-router";

export default defineComponent({
  components: {
    ScholasticStandingForm,
  },
  props: {
    scholasticStandingId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    return { goBackRouteParams };
  },
});
</script>
