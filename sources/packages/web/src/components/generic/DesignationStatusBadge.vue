<!--
Used when we need to display the designation status for an Institution
-->
<!-- TODO: Replace v-badge with vuetify2 equivalent v-chip with icon once veutify3 is released-->
<template>
  <v-badge
    color="green"
    :content="designationStatus"
    :icon="icon"
    location="top-right"
    text-color="white"
  >
  </v-badge>
</template>
<script lang="ts">
import { computed } from "vue";
enum DesignationStatus {
  designated = "DESIGNATED",
}
export default {
  props: {
    designationStatus: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const icon = computed(() => {
      switch (props.designationStatus) {
        case DesignationStatus.designated:
          return "mdi-check";
        default:
          return null;
      }
    });
    return {
      icon,
    };
  },
};
</script>
