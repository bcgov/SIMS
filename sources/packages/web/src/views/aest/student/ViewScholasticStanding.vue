<template>
  <full-page-container>
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
      :showFooter="true"
      :showCompleteInfo="true"
    />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { computed } from "vue";
import { RouteLocationRaw } from "vue-router";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
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
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        } as RouteLocationRaw),
    );

    return { goBackRouteParams };
  },
};
</script>
