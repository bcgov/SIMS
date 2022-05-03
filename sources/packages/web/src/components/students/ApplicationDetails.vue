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
        <ApplicationProgressBar :applicationDetails="applicationDetails" />
        <formio
          formName="trackstudentapplication"
          :data="dataForTracking"
          @customEvent="customEventCallback"
        ></formio> </v-container
    ></v-card>
  </v-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import formio from "@/components/generic/formio.vue";
import ApplicationProgressBar from "@/components/students/progressBar/ApplicationProgressBar.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  ApplicationStatus,
  GetApplicationDataDto,
  StudentApplicationDetails,
  StudentApplicationDetailsForTracking,
} from "@/types";

export default {
  components: {
    formio,
    ApplicationProgressBar,
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
    const customEventCallback = async (
      _form: any,
      event: FormIOCustomEvent,
    ) => {
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
              assessmentId: props.applicationDetails.assessmentId,
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
    });
    return {
      ApplicationStatus,
      initialData,
      dataForTracking,
      customEventCallback,
    };
  },
};
</script>
