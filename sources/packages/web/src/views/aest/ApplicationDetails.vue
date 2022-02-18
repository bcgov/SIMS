<template>
  <h5 class="muted-heading-text">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Student Details</a
    >
  </h5>
  <full-page-container v-if="applicationDetail.data">
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
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  GetApplicationBaseDTO,
  WizardNavigationEvent,
  OfferingIntensity,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import formio from "@/components/generic/formio.vue";
import {
  useFormioDropdownLoader,
  useFormioUtils,
  useFormioComponentLoader,
} from "@/composables";
import {
  LOCATIONS_DROPDOWN_KEY,
  PROGRAMS_DROPDOWN_KEY,
  OFFERINGS_DROPDOWN_KEY,
  SELECTED_PROGRAM_DESC_KEY,
  OFFERING_INTENSITY_KEY,
} from "@/constants";

export default {
  components: { FullPageContainer, formio },
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
    const router = useRouter();
    const applicationDetail = ref({} as GetApplicationBaseDTO);
    const initialData = ref({});
    const selectedForm = ref();
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    let applicationWizard: any;
    const formioDataLoader = useFormioDropdownLoader();
    const formioUtils = useFormioUtils();
    const formioComponentLoader = useFormioComponentLoader();

    const getSelectedId = (form: any) => {
      return formioUtils.getComponentValueByKey(form, LOCATIONS_DROPDOWN_KEY);
    };

    onMounted(async () => {
      applicationDetail.value = await ApplicationService.shared.getApplicationDetail(
        props.applicationId,
        props.studentId,
      );
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = applicationDetail.value.data;
    });

    const goBack = () => {
      router.push({
        name: AESTRoutesConst.STUDENT_DETAILS,
        params: {
          studentId: props.studentId,
        },
      });
    };

    const formLoaded = async (form: any) => {
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

      // load all dropdown data
      await formioDataLoader.loadLocations(form, LOCATIONS_DROPDOWN_KEY);
      const selectedLocationId = getSelectedId(form);

      if (selectedLocationId) {
        // here both active and inactive program year.
        await formioDataLoader.loadProgramsForLocation(
          form,
          +selectedLocationId,
          PROGRAMS_DROPDOWN_KEY,
          applicationDetail.value.applicationProgramYearID,
          true,
        );
      }

      const selectedProgramId = formioUtils.getComponentValueByKey(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );
      const selectedIntensity: OfferingIntensity = formioUtils.getComponentValueByKey(
        form,
        OFFERING_INTENSITY_KEY,
      );
      if (selectedProgramId && selectedIntensity) {
        await formioComponentLoader.loadProgramDesc(
          form,
          selectedProgramId,
          SELECTED_PROGRAM_DESC_KEY,
        );
        // here both active and inactive program year.
        await formioDataLoader.loadOfferingsForLocation(
          form,
          selectedProgramId,
          selectedLocationId,
          OFFERINGS_DROPDOWN_KEY,
          applicationDetail.value.applicationProgramYearID,
          selectedIntensity,
          true,
        );
      }
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
      goBack,
      isFirstPage,
      isLastPage,
      formLoaded,
      wizardGoPrevious,
      wizardGoNext,
    };
  },
};
</script>
