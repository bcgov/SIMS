<!--
Used when we need to display the designation status for an Institution
-->
<template>
  <v-badge bordered color="green" text-color="white">
    <template v-slot:badge>
      <font-awesome-icon :icon="icon" class="mr-1" />
      {{ designationStatus }}
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
        return "check";
      }
      return null;
    });
    return {
      icon,
    };
  },
};
</script>
