<template>
  <div>
    <div class="row">
      <div>
        One of three columns
      </div>
      <div>
        One of three columns
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { EducationProgramData } from "@/types";

export default {
  props: {
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramData,
    },
  },
};
</script>
