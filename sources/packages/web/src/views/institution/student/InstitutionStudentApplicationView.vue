<template>
  <full-page-container v-if="applicationDetail.data">
    <template #header>
      <header-navigator
        title="Back to student applications"
        :routeLocation="{
          name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Financial Aid Application"
      >
      </header-navigator>
    </template>
    <h2 class="color-blue pb-4">
      Student Application Details
      {{ applicationDetail.applicationNumber }}
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
import { onMounted, ref, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationBaseAPIOutDTO } from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import StudentApplication from "@/components/common/StudentApplication.vue";

export default defineComponent({
  components: {
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
  setup(props) {
    const applicationDetail = ref({} as ApplicationBaseAPIOutDTO);
    const initialData = ref({});
    const selectedForm = ref();

    onMounted(async () => {
      applicationDetail.value =
        await ApplicationService.shared.getApplicationDetail(
          props.applicationId,
          {
            studentId: props.studentId,
            isParentApplication: true,
          },
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
      InstitutionRoutesConst,
    };
  },
});
</script>
