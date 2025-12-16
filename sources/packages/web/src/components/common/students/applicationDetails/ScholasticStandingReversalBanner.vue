<template>
  <banner
    :type="BannerTypes.Success"
    summary="Scholastic Standing event previously reported for this application was reversed by StudentAid BC and no longer has any impact on your application."
  />
</template>
<script lang="ts">
import { BannerTypes } from "@/types";

export default {
  name: "ScholasticStandingReversalBanner",
  setup() {
    return {
      BannerTypes,
    };
  },
};
</script>
