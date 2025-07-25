<template>
  <scholastic-standing-view-base
    :studentId="studentId"
    :applicationId="applicationId"
    :scholasticStandingId="scholasticStandingId"
  />
</template>
<script lang="ts">
import ScholasticStandingViewBase from "@/components/common/ScholasticStandingViewBase.vue";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingViewBase,
  },
  props: {
    studentId: {
      type: Number,
      required: false,
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
};
</script>
