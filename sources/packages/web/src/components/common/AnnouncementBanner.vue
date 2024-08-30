<template>
  <banner
    class="mb-2"
    :type="BannerTypes.Warning"
    header="Announcement"
    :summary="location"
  ></banner>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
export default defineComponent({
  props: {
    location: {
      type: String,
      required: true,
    },
  },
  setup() {
    return {
      BannerTypes,
    };
  },
});
</script>
