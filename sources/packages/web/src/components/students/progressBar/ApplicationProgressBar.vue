<template>
  <v-container>
    <p class="category-header-large">Track your application</p>
    <div class="progress">
      <div
        class="progress-bar bg-secondary"
        :class="progressBarClass"
        role="progressbar"
        :style="progressBarStyle"
        aria-valuemax="100"
      >
        {{ progressBarLabel }}
      </div>
    </div>
    <v-row class="mt-1 mb-2">
      <v-col>{{ ApplicationStatus.submitted }}</v-col>
      <v-col
        >{{ ApplicationStatus.inProgress }}
        <i class="mr-2" :class="inProgressIconClass" aria-hidden="true"></i
      ></v-col>
      <v-col>{{ ApplicationStatus.assessment }} </v-col>
      <v-col
        >{{ ApplicationStatus.enrollment }}
        <i class="mr-2" :class="enrollmentIconClass" aria-hidden="true"></i
      ></v-col>
      <v-col
        >{{ ApplicationStatus.completed }}
        <i class="mr-2" :class="completeIconClass" aria-hidden="true"></i
      ></v-col>
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import {
  ApplicationStatus,
  GetApplicationDataDto,
  COEStatus,
  ProgramInfoStatus,
} from "@/types";

export default {
  props: {
    applicationDetails: {
      type: Object,
      required: true,
      default: {} as GetApplicationDataDto,
    },
  },
  setup(props: any) {
    const progressBarStyle = ref();
    const progressBarLabel = ref();
    const inProgressIconClass = ref();
    const enrollmentIconClass = ref();
    const completeIconClass = ref();
    const progressBarClass = ref();

    const setStyles = () => {
      if (
        ApplicationStatus.draft === props.applicationDetails.applicationStatus
      ) {
        progressBarStyle.value = "";
        progressBarLabel.value = "";
        progressBarClass.value = "bg-secondary";
      }
      if (
        ApplicationStatus.submitted ===
        props.applicationDetails.applicationStatus
      ) {
        progressBarStyle.value = "width: 10%";
        progressBarLabel.value = ApplicationStatus.submitted;
        progressBarClass.value = "bg-warning text-white";
      }
      if (
        ApplicationStatus.inProgress ===
          props.applicationDetails.applicationStatus &&
        ProgramInfoStatus.declined !==
          props.applicationDetails.applicationPIRStatus
      ) {
        progressBarStyle.value = "width: 30%";
        progressBarLabel.value = ApplicationStatus.inProgress;
        progressBarClass.value = "bg-warning text-white";
      }
      if (
        ApplicationStatus.inProgress ===
          props.applicationDetails.applicationStatus &&
        ProgramInfoStatus.declined ===
          props.applicationDetails.applicationPIRStatus
      ) {
        progressBarStyle.value = "width: 100%";
        progressBarLabel.value = ApplicationStatus.inProgress;
        inProgressIconClass.value = "fa fa-exclamation-circle text-danger";
        progressBarClass.value = "bg-danger text-white";
      }
      if (
        ApplicationStatus.assessment ===
        props.applicationDetails.applicationStatus
      ) {
        progressBarStyle.value = "width: 50%";
        progressBarLabel.value = ApplicationStatus.assessment;
        progressBarClass.value = "bg-warning text-white";
      }
      if (
        ApplicationStatus.enrollment ===
          props.applicationDetails.applicationStatus &&
        COEStatus.declined === props.applicationDetails.applicationCOEStatus
      ) {
        progressBarStyle.value = "width: 100%";
        progressBarLabel.value = ApplicationStatus.enrollment;
        enrollmentIconClass.value = "fa fa-exclamation-circle text-danger ";
        progressBarClass.value = "bg-danger text-white";
      }
      if (
        ApplicationStatus.enrollment ===
          props.applicationDetails.applicationStatus &&
        COEStatus.declined !== props.applicationDetails.applicationCOEStatus
      ) {
        progressBarStyle.value = "width: 70%";
        progressBarLabel.value = ApplicationStatus.enrollment;
        progressBarClass.value = "bg-warning text-white";
      }
      if (
        ApplicationStatus.completed ===
        props.applicationDetails.applicationStatus
      ) {
        progressBarStyle.value = "width: 100%";
        progressBarLabel.value = ApplicationStatus.completed;
        completeIconClass.value = "fa fa-check-circle text-success";
        progressBarClass.value = "bg-success text-white";
      }
    };

    onMounted(async () => {
      setStyles();
    });
    return {
      ApplicationStatus,
      progressBarStyle,
      progressBarLabel,
      inProgressIconClass,
      enrollmentIconClass,
      completeIconClass,
      progressBarClass,
    };
  },
};
</script>
