<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Submission"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <scholastic-standing-form
      :scholasticStandingId="scholasticStandingId"
      :readOnly="true"
    />
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { computed } from "vue";
import { RouteLocationRaw } from "vue-router";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    scholasticStandingId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const goBackRouteParams = computed(
      () =>
        ({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: { id: props.applicationId },
        } as RouteLocationRaw),
    );

    return { goBackRouteParams };
  },
};
</script>
