<template>
  <header-navigator
    title="Back to student applications"
    :routeLocation="{
      name: AESTRoutesConst.STUDENT_APPLICATIONS,
      params: { studentId },
    }"
    subTitle="Financial Aid Application"
  >
  </header-navigator>
  <full-page-container v-if="applicationDetail.data" class="my-2">
    <h2 class="color-blue pb-4">
      Student Application Details
      {{
        applicationDetail.applicationNumber
          ? " - " + applicationDetail.applicationNumber
          : ""
      }}
    </h2>
    <StudentApplication
      :selectedForm="selectedForm"
      :initialData="initialData"
      :programYearId="applicationDetail.applicationProgramYearID"
      :isReadOnly="true"
    />
  </full-page-container>
  <router-view />
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { GetApplicationBaseDTO } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import StudentApplication from "@/components/common/StudentApplication.vue";

export default {
  components: {
    FullPageContainer,
    HeaderNavigator,
    StudentApplication,
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
  setup(props: any) {
    const applicationDetail = ref({} as GetApplicationBaseDTO);
    const initialData = ref({});
    const selectedForm = ref();

    onMounted(async () => {
      applicationDetail.value = await ApplicationService.shared.getApplicationDetail(
        props.applicationId,
      );
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = {
        ...applicationDetail.value.data,
        isReadOnly: true,
      };
    });

    return {
      applicationDetail,
      initialData,
      selectedForm,
      AESTRoutesConst,
    };
  },
};
</script>
