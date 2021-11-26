<!--
Used when we need to display the designation status for an Institution
-->
<!-- TODO: Replace v-badge with vuetify2 equivalent v-chip with icon once veutify3 is released-->
<template>
  <v-badge bordered color="green" text-color="white">
    <template v-slot:badge>
      <v-icon left size="15"> {{ icon }} </v-icon>{{ designationStatus }}
    </template>
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
      if (props.designationStatus === DesignationStatus.designated) {
        return "mdi-check";
      }
      return null;
    });
    return {
      icon,
    };
  },
};
</script>
