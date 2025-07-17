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
  <application-header-title :application-id="applicationId" />
  <div class="mb-2" v-if="formData && formData.parentFullName">
    <detail-header :header-map="{ 'Parent Name': formData.parentFullName }" />
  </div>
  <full-page-container class="my-2">
    <formio
      v-if="formName && formData.supportingData"
      :formName="formName"
      :data="formData"
      :readOnly="true"
    ></formio>
    <banner
      v-else
      class="mt-2"
      :type="BannerTypes.Warning"
      summary="Supporting User has not submitted the application."
    />
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";

export default defineComponent({
  components: {
    ApplicationHeaderTitle,
    DetailHeader,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    supportingUserId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { dateOnlyLongString } = useFormatters();
    const formName = ref();
    const formData = ref();

    onMounted(async () => {
      const supportingUsersData =
        await SupportingUsersService.shared.getSupportingUserData(
          props.supportingUserId,
        );
      formName.value = supportingUsersData.formName;
      let contactAddress = {};
      // Here there is only one address for now
      if (supportingUsersData.contactInfo?.address) {
        const address = supportingUsersData.contactInfo.address;
        contactAddress = {
          city: address.city,
          country: address.country,
          provinceState: address.provinceState,
          postalCode: address.postalCode,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
        };
      }
      // for both parent and partner first tab is same
      // and the information on the 2nd tab is fed in `supportingData`
      formData.value = {
        isAbleToReport: supportingUsersData.isAbleToReport,
        givenNames: supportingUsersData.personalInfo?.givenNames,
        lastName: supportingUsersData.personalInfo?.lastName,
        email: supportingUsersData.email,
        dateOfBirth: dateOnlyLongString(supportingUsersData.birthDate),
        sin: supportingUsersData.sin,
        phone: supportingUsersData.contactInfo?.phone,
        supportingData: supportingUsersData.supportingData,
        ...contactAddress,
        hasValidSIN: supportingUsersData.personalInfo?.hasValidSIN,
        parentFullName: supportingUsersData.parentFullName,
      };
    });
    return {
      formName,
      formData,
      AESTRoutesConst,
      BannerTypes,
    };
  },
});
</script>
