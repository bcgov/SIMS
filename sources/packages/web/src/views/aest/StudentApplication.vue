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
    <formio
      :formName="selectedForm"
      :data="initialData"
      :readOnly="true"
      @loaded="formLoaded"
    ></formio>
    <v-row>
      <v-col md="6">
        <v-btn
          color="primary"
          v-show="!isFirstPage"
          outlined
          @click="wizardGoPrevious()"
          >Previous section</v-btn
        >
      </v-col>
      <v-col md="6" class="ml-auto text-right">
        <v-btn color="primary" v-show="!isLastPage" @click="wizardGoNext()"
          >Next section</v-btn
        >
      </v-col>
    </v-row>
  </full-page-container>
  <router-view />
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { GetApplicationBaseDTO, WizardNavigationEvent } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import formio from "@/components/generic/formio.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { FullPageContainer, formio, HeaderNavigator },
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
    let applicationWizard: any;

    onMounted(async () => {
      applicationDetail.value = await ApplicationService.shared.getApplicationDetail(
        props.applicationId,
        props.studentId,
      );
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = applicationDetail.value.data;
    });

    const formLoaded = (form: any) => {
      applicationWizard = form;

      applicationWizard.on("wizardPageSelected", (page: any, index: number) => {
        isFirstPage.value = index === 0;
        isLastPage.value = applicationWizard.isLastPage();
      });
      // Handle the navigation using next/prev buttons.
      const prevNextNavigation = (navigation: WizardNavigationEvent) => {
        isFirstPage.value = navigation.page === 0;
        isLastPage.value = applicationWizard.isLastPage();
      };
      applicationWizard.on("prevPage", prevNextNavigation);
      applicationWizard.on("nextPage", prevNextNavigation);
    };

    const wizardGoPrevious = () => {
      applicationWizard.prevPage();
    };

    const wizardGoNext = () => {
      applicationWizard.nextPage();
    };
    return {
      applicationDetail,
      initialData,
      selectedForm,
      isFirstPage,
      isLastPage,
      formLoaded,
      wizardGoPrevious,
      wizardGoNext,
      AESTRoutesConst,
    };
  },
};
</script>
