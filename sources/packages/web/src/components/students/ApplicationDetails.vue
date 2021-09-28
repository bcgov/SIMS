<template>
  <v-container>
    <v-card>
      <formio
        formName="studentapplicationdetails"
        :data="initialData"
        @customEvent="customEventCallback"
      ></formio>
    </v-card>
    <v-card>
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

        <formio
          formName="trackstudentapplication"
          :data="dataForTracking"
          @customEvent="customEventCallback"
        ></formio></v-container
    ></v-card>
  </v-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import formio from "@/components/generic/formio.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  ApplicationStatus,
  GetApplicationDataDto,
  StudentApplicationDetails,
  StudentApplicationDetailsForTracking,
  COEStatus,
  ProgramInfoStatus,
} from "@/types";

export default {
  components: {
    formio,
  },
  props: {
    applicationDetails: {
      type: Object,
      required: true,
      default: {} as GetApplicationDataDto,
    },
  },
  setup(props: any) {
    const initialData = ref({} as StudentApplicationDetails);
    const dataForTracking = ref({} as StudentApplicationDetailsForTracking);
    const router = useRouter();
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

    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      switch (event.type) {
        case FormIOCustomEventTypes.RouteToContinueApplication:
          router.push({
            name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
            params: {
              selectedForm: props.applicationDetails.applicationFormName,
              programYearId: props.applicationDetails.applicationProgramYearID,
              id: props.applicationDetails.id,
            },
          });
          break;
        case FormIOCustomEventTypes.RouteToConfirmAssessment:
          router.push({
            name: StudentRoutesConst.ASSESSMENT,
            params: {
              applicationId: props.applicationDetails.id,
            },
          });
          break;
        case FormIOCustomEventTypes.RouteToViewStudentApplication:
          router.push({
            name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM_VIEW,
            params: {
              selectedForm: props.applicationDetails.applicationFormName,
              programYearId: props.applicationDetails.applicationProgramYearID,
              id: props.applicationDetails.id,
              readOnly: "readOnly",
            },
          });
          break;
        default:
          return null;
      }
    };
    onMounted(async () => {
      initialData.value = {
        applicationStatusUpdatedOn:
          props.applicationDetails.applicationStatusUpdatedOn,
        applicationNumber: props.applicationDetails.applicationNumber ?? "-",
        applicationOfferingIntensity:
          props.applicationDetails.applicationOfferingIntensity ?? "-",
        applicationStartDate: props.applicationDetails.applicationStartDate,
        applicationEndDate: props.applicationDetails.applicationEndDate,
        applicationInstitutionName:
          props.applicationDetails.applicationInstitutionName ?? "-",
        applicationStatus: props.applicationDetails.applicationStatus,
      };
      dataForTracking.value = {
        applicationStatus: props.applicationDetails.applicationStatus,
        applicationPIRStatus: props.applicationDetails.applicationPIRStatus,
        applicationAssessmentStatus:
          props.applicationDetails.applicationAssessmentStatus,
        applicationCOEStatus: props.applicationDetails.applicationCOEStatus,
        applicationInstitutionName:
          props.applicationDetails.applicationInstitutionName,
        applicationPIRDeniedReason:
          props.applicationDetails.applicationPIRDeniedReason,
        applicationCOEDeniedReason:
          props.applicationDetails.applicationCOEDeniedReason,
      };
      setStyles();
    });
    return {
      ApplicationStatus,
      initialData,
      dataForTracking,
      progressBarStyle,
      progressBarLabel,
      inProgressIconClass,
      enrollmentIconClass,
      completeIconClass,
      customEventCallback,
      progressBarClass,
    };
  },
};
</script>
