<template>
  <body-header-container>
    <template #header v-if="supportingUser.fullName">
      <body-header :title="supportingUser.fullName" />
    </template>
    <template v-if="supportingUser.formName"
      ><formio-container
        :formName="supportingUser.formName"
        :formData="formInitialData"
        :readOnly="isReadonly"
        @loaded="formLoaded"
        @submitted="submitted"
      >
        <!-- Navigation buttons -->
        <template #actions="{ submit }" v-if="!isReadonly">
          <footer-buttons
            :justify="isFirstPage ? 'end' : 'space-between'"
            :processing="updateInProgress"
            @secondaryClick="wizardGoPrevious"
            secondaryLabel="Back"
            :showSecondaryButton="!isFirstPage"
            @primaryClick="wizardGoNext"
            primaryLabel="Next step"
          >
            <!-- On the last page, show the submit button as primary. -->
            <template #primary-buttons v-if="isLastPage">
              <v-btn
                class="float-right"
                color="primary"
                @click="submit"
                :loading="updateInProgress"
              >
                {{ updateInProgress ? "Submitting..." : "Submit form" }}
              </v-btn>
            </template>
          </footer-buttons>
        </template>
      </formio-container></template
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
import { useFormioUtils, useFormatters } from "@/composables";

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
    isReadonly: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, context) {
    const { disableWizardButtons } = useFormioUtils();
    const { dateOnlyLongString } = useFormatters();
    const supportingUser = ref({} as SupportingUser);
    let formInstance: FormIOForm<Record<string, unknown>>;
    const isFirstPage = ref(true);
    const isLastPage = ref(false);
    const showNav = ref(false);
    const formInitialData = ref({} as Record<string, unknown>);
    const isDataReady = ref(false);

    watchEffect(async () => {
      if (props.supportingUserId) {
        supportingUser.value =
          await SupportingUsersService.shared.getSupportingUserData(
            props.supportingUserId,
          );
        // Here there is only one address for now
        let contactAddress = {};
        if (supportingUser.value.contactInfo?.address) {
          const address = supportingUser.value.contactInfo.address;
          contactAddress = {
            city: address.city,
            country: address.country,
            provinceState: address.provinceState,
            postalCode: address.postalCode,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
          };
        }
        // For both parent and partner, the first tab is the same,
        // and the information on the 2nd tab is fed into supportingData.
        formInitialData.value = {
          isAbleToReport: supportingUser.value.isAbleToReport,
          programYearStartDate: supportingUser.value.programYearStartDate,
          givenNames: supportingUser.value.personalInfo?.givenNames,
          lastName: supportingUser.value.personalInfo?.lastName,
          email: supportingUser.value.email,
          dateOfBirth: dateOnlyLongString(supportingUser.value.birthDate),
          sin: supportingUser.value.sin,
          phone: supportingUser.value.contactInfo?.phone,
          supportingData: supportingUser.value.supportingData,
          ...contactAddress,
          hasValidSIN: supportingUser.value.personalInfo?.hasValidSIN,
          parentFullName: supportingUser.value.parentFullName,
        };
        isDataReady.value = true;
      }
    });

    const wizardGoPrevious = () => {
      formInstance.prevPage();
    };

    const wizardGoNext = () => {
      formInstance.nextPage();
    };

    const submitted = (form: FormIOForm<Record<string, unknown>>) => {
      context.emit("formSubmitted", form.data);
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
      wizardGoPrevious,
      wizardGoNext,
      formLoaded,
      submitted,
      supportingUser,
      BannerTypes,
      formInitialData,
    };
  },
});
</script>
