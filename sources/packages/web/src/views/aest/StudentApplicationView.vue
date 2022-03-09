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
      :formName="selectedForm"
      :data="initialData"
      :readOnly="true"
      @loaded="loadForm"
    />
    <StudentApplicationCommonActions
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @wizardGoPrevious="wizardGoPrevious"
      @wizardGoNext="wizardGoNext"
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
import { useStudentApplication } from "@/composables";
import StudentApplication from "@/components/common/StudentApplication.vue";
import StudentApplicationCommonActions from "@/components/common/StudentApplicationCommonActions.vue";

export default {
  components: {
    FullPageContainer,
    HeaderNavigator,
    StudentApplication,
    StudentApplicationCommonActions,
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
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    // TODO:ANN- CHECK HERE THE PROGRAMYEARID, 2ND parametre of useStudentApplication
    const {
      formLoaded,
      wizardGoPrevious,
      wizardGoNext,
    } = useStudentApplication(true, 1);

    onMounted(async () => {
      applicationDetail.value = await ApplicationService.shared.getApplicationDetail(
        props.applicationId,
        props.studentId,
      );
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = applicationDetail.value.data;
    });

    const loadForm = (form: any) => {
      formLoaded(form);
    };

    return {
      applicationDetail,
      initialData,
      selectedForm,
      isFirstPage,
      isLastPage,
      loadForm,
      wizardGoPrevious,
      wizardGoNext,
      AESTRoutesConst,
    };
  },
};
</script>
