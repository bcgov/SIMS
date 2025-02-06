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
      :initialData="initialData"
      :readOnly="true"
      :locationId="$props.locationId"
    />
  </full-page-container>
</template>
<script lang="ts">
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import { computed, onMounted, ref, defineComponent } from "vue";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteLocationRaw } from "vue-router";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "@/services/http/dto";

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
    const initialData = ref({} as ScholasticStandingSubmittedDetailsAPIOutDTO);

    onMounted(async () => {
      initialData.value =
        await ScholasticStandingService.shared.getScholasticStanding(
          props.scholasticStandingId,
        );
    });

    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    return { initialData, goBackRouteParams };
  },
});
</script>
