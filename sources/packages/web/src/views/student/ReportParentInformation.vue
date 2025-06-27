<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application details"
        subTitle="Parent information"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: applicationId,
          },
        }"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <template #alerts>
      <banner
        summary="You are submitting this declaration on behalf of your parent. Please complete the following financial information questions with your parents information."
        :type="BannerTypes.Info"
      ></banner>
    </template>
    <body-header-container>
      <template #header>
        <body-header :title="supportingUser.fullName" />
      </template>
      <formio
        v-if="supportingUser.formName"
        :formName="supportingUser.formName"
        :data="formInitialData"
        @loaded="formLoaded"
        @submitted="submitted"
      ></formio>
    </body-header-container>
    <v-row v-if="showNav">
      <v-col>
        <v-btn
          color="primary"
          v-show="!isFirstPage"
          variant="outlined"
          data-cy="previousSection"
          @click="wizardGoPrevious"
          >Back</v-btn
        >
      </v-col>
      <v-col>
        <v-btn
          class="float-right"
          color="primary"
          v-show="!isLastPage"
          @click="wizardGoNext"
          >Next step</v-btn
        >
        <v-btn
          class="float-right"
          :disabled="!isLastPage || submitting"
          v-show="!isFirstPage"
          color="primary"
          @click="wizardSubmit()"
          :loading="submitting"
        >
          {{ submitting ? "Submitting..." : "Submit form" }}
        </v-btn>
      </v-col>
    </v-row>
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormIOForm,
  SupportingUser,
  WizardNavigationEvent,
  BannerTypes,
} from "@/types";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { useFormioUtils } from "@/composables";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: { ApplicationHeaderTitle },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    supportingUserId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { disableWizardButtons, excludeExtraneousValues } = useFormioUtils();
    const supportingUser = ref({} as SupportingUser);
    let formInstance: FormIOForm<Record<string, unknown>>;
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const showNav = ref(false);
    const submitting = ref(false);
    const formInitialData = ref({} as { isAbleToReport: boolean });

    onMounted(async () => {
      supportingUser.value =
        await SupportingUsersService.shared.getSupportingUserData(
          props.supportingUserId,
        );
      formInitialData.value = {
        isAbleToReport: supportingUser.value.isAbleToReport,
      };
    });

    const wizardSubmit = () => {
      formInstance.submit();
    };

    const wizardGoPrevious = () => {
      formInstance.prevPage();
    };

    const wizardGoNext = () => {
      formInstance.nextPage();
    };

    const formLoaded = async (form: FormIOForm<Record<string, unknown>>) => {
      showNav.value = true;
      formInstance = form;
      // Disable internal submit button.
      disableWizardButtons(formInstance);
      formInstance.options.buttonSettings.showSubmit = false;
      // Handle the navigation using the breadcrumbs.
      formInstance.on(
        "wizardPageSelected",
        (_page: WizardNavigationEvent, index: number) => {
          isFirstPage.value = index === 0;
          isLastPage.value = formInstance.isLastPage();
        },
      );
      // Handle the navigation using next/prev buttons.
      const prevNextNavigation = (navigation: WizardNavigationEvent) => {
        isFirstPage.value = navigation.page === 0;
        isLastPage.value = formInstance.isLastPage();
      };
      formInstance.on("prevPage", prevNextNavigation);
      formInstance.on("nextPage", prevNextNavigation);
    };

    const submitted = async (formData: Record<string, unknown>) => {
      // exclude extraneous values from the form data.
    };
    return {
      isFirstPage,
      isLastPage,
      showNav,
      wizardSubmit,
      wizardGoPrevious,
      wizardGoNext,
      formLoaded,
      submitted,
      submitting,
      supportingUser,
      StudentRoutesConst,
      BannerTypes,
      formInitialData,
    };
  },
});
</script>
