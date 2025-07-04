<template>
  <body-header-container>
    <template #header>
      <body-header :title="supportingUser.fullName" />
    </template>
    <template v-if="supportingUser.formName"
      ><formio
        :formName="supportingUser.formName"
        :data="formInitialData"
        @loaded="formLoaded"
        @submitted="$emit('formSubmitted', $event)"
      ></formio>
      <!-- Navigation buttons -->
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
            :disabled="!isLastPage || updateInProgress"
            v-show="!isFirstPage"
            color="primary"
            @click="wizardSubmit()"
            :loading="updateInProgress"
          >
            {{ updateInProgress ? "Submitting..." : "Submit form" }}
          </v-btn>
        </v-col>
      </v-row></template
    >
  </body-header-container>
</template>
<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import {
  FormIOForm,
  SupportingUser,
  WizardNavigationEvent,
  BannerTypes,
} from "@/types";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { useFormioUtils } from "@/composables";

export default defineComponent({
  emits: {
    formSubmitted: (formData: Record<string, unknown>) => {
      return !!formData;
    },
  },
  props: {
    supportingUserId: {
      type: Number,
      required: true,
    },
    updateInProgress: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { disableWizardButtons } = useFormioUtils();
    const supportingUser = ref({} as SupportingUser);
    let formInstance: FormIOForm<Record<string, unknown>>;
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const showNav = ref(false);
    const formInitialData = ref({} as Record<string, unknown>);

    watchEffect(async () => {
      if (props.supportingUserId) {
        supportingUser.value =
          await SupportingUsersService.shared.getSupportingUserData(
            props.supportingUserId,
          );
        formInitialData.value = {
          isAbleToReport: supportingUser.value.isAbleToReport,
          programYearStartDate: supportingUser.value.programYearStartDate,
        };
      }
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
    return {
      isFirstPage,
      isLastPage,
      showNav,
      wizardSubmit,
      wizardGoPrevious,
      wizardGoNext,
      formLoaded,
      supportingUser,
      BannerTypes,
      formInitialData,
    };
  },
});
</script>
