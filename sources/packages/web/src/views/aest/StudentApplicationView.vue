<template>
  <full-page-container v-if="applicationDetail.data" class="my-2">
    <template #header>
      <header-navigator
        title="Back to student applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Financial Aid Application"
      >
      </header-navigator>
    </template>
    <h2 class="color-blue pb-4">
      Student Application Details
      {{
        applicationDetail.applicationNumber
          ? HYPHEN_WITH_SPACE + applicationDetail.applicationNumber
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
import { onMounted, ref, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationBaseAPIOutDTO } from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import { HYPHEN_WITH_SPACE } from "@/composables/useFormatters";
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
  setup(props: any) {
    const applicationDetail = ref({} as ApplicationBaseAPIOutDTO);
    const initialData = ref({});
    const selectedForm = ref();

    onMounted(async () => {
      applicationDetail.value =
        await ApplicationService.shared.getApplicationDetail(
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
      HYPHEN_WITH_SPACE,
    };
  },
});
</script>
