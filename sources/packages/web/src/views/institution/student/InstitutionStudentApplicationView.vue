<template>
  <full-page-container v-if="applicationDetail.data">
    <template #header>
      <header-navigator
        title="Back to student applications"
        :route-location="{
          name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        sub-title="Financial Aid Application"
      >
      </header-navigator>
      <application-header-title :application-id="applicationId" />
    </template>
    <h2 class="color-blue pb-4">
      Student Application Details
      {{ applicationDetail.applicationNumber }}
    </h2>
    <StudentApplication
      :selected-form="selectedForm"
      :initial-data="initialData"
      :program-year-id="applicationDetail.applicationProgramYearID"
      :is-read-only="true"
      :is-data-ready="isDataReady"
    />
  </full-page-container>
  <router-view />
</template>
<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationBaseAPIOutDTO } from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import StudentApplication from "@/components/common/StudentApplication.vue";
import { StudentApplicationFormData } from "@/types";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: {
    StudentApplication,
    ApplicationHeaderTitle,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const applicationDetail = ref({} as ApplicationBaseAPIOutDTO);
    const initialData = ref({} as StudentApplicationFormData);
    const selectedForm = ref();
    const isDataReady = ref(false);

    onMounted(async () => {
      applicationDetail.value =
        await ApplicationService.shared.getApplicationDetail(
          props.applicationId,
          {
            studentId: props.studentId,
          },
        );
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = {
        ...applicationDetail.value.data,
        applicationOfferingIntensityValue:
          applicationDetail.value.applicationOfferingIntensity,
        isReadOnly: true,
      };
      isDataReady.value = true;
    });

    return {
      applicationDetail,
      initialData,
      selectedForm,
      InstitutionRoutesConst,
      isDataReady,
    };
  },
});
</script>
