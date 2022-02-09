<template>
  <div class="ml-4 mb-2">
    <div class="row">
      <div>
        <span class="label-bold">Institution name:</span
        ><span> Camosun College</span>
      </div>
      <div class="mx-2 vertical-divider"></div>
      <div>
        <span class="label-bold">Submitted:</span><span> Nov 14 2021</span>
      </div>
    </div>
    <div class="row mt-1">
      <div>
        <span class="label-bold">Approved by:</span
        ><span> Ralph Edwards, AEST:EX</span>
      </div>
      <div class="mx-2 vertical-divider"></div>
      <div>
        <span class="label-bold">Approved:</span><span> Oct 14 2021</span>
      </div>
      <div class="mx-2 vertical-divider"></div>
      <div>
        <span class="label-bold">Effective end date:</span
        ><span> Oct 03 2021</span>
      </div>
    </div>
    <div class="row mt-1">
      <div>
        <span class="label-bold">Denied by:</span
        ><span> Ralph Edwards, AEST:EXX</span>
      </div>
      <div class="mx-2 vertical-divider"></div>
      <div>
        <span class="label-bold">Denied:</span><span> Oct 14 2021</span>
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
