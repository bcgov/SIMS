<template>
  <banner
    class="my-2"
    :type="BannerTypes.Error"
    header="This program is currently restricted"
  />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
export default defineComponent({
  setup() {
    return {
      BannerTypes,
    };
  },
});
</script>
