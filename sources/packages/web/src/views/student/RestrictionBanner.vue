<template>
  <banner
    class="mb-2"
    v-if="restriction"
    :type="BannerTypes.Error"
    header="Your account has a restriction"
    summary="You have a restriction on your account that must be resolved to continue with your student financial aid. Please view the message and resolve the items to minimize disruption and impact."
  >
    <template #actions>
      <v-btn :color="BannerTypes.Error"> View activity </v-btn>
    </template></banner
  >
  <banner
    class="mb-2"
    v-if="warning"
    :type="BannerTypes.Warning"
    header="Your account has a warning"
    summary="You should resolve this as soon as possible to minimize impact to your funding. Please view the message and resolve the items to minimize disruption and impact."
    ><template #actions>
      <v-btn :color="BannerTypes.Warning"> View activity </v-btn>
    </template></banner
  >
</template>
<script lang="ts">
import { computed, onMounted } from "vue";
import { useStudentStore } from "@/composables";
import { BannerTypes } from "@/components/generic/Banner.models";
export default {
  setup() {
    const { updateRestrictions, hasRestriction, hasWarning } =
      useStudentStore();
    const restriction = computed(() => {
      return hasRestriction();
    });

    const warning = computed(() => {
      return hasWarning();
    });
    onMounted(async () => {
      await updateRestrictions();
    });
    return { BannerTypes, restriction, warning };
  },
};
</script>
