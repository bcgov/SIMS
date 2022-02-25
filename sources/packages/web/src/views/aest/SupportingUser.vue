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
  <full-page-container class="my-2">
    <formio
      v-if="formName"
      :formName="formName"
      :data="formData"
      :readOnly="true"
    ></formio>
    <Message v-else severity="warn" :closable="false">
      <strong>
        Supporting User has not submitted the application.
      </strong>
    </Message>
  </full-page-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { ref, onMounted } from "vue";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { useFormatters } from "@/composables";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: {
    formio,
    FullPageContainer,
    HeaderNavigator,
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
  },
  setup(props: any) {
    const { dateOnlyLongString } = useFormatters();
    const formName = ref();
    const formData = ref();

    onMounted(async () => {
      const supportingUsersData = await SupportingUsersService.shared.getSupportingUserData(
        props.supportingUserId,
      );
      formName.value = supportingUsersData.formName;
      let contactAddress = {};
      // Here there is only one address for now
      if (supportingUsersData.contactInfo.addresses.length) {
        const address = supportingUsersData.contactInfo.addresses[0];
        contactAddress = {
          city: address.city,
          country: address.country,
          provinceState: address.province,
          postalCode: address.postalCode,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
        };
      }
      // for both parent and partner first tab is same
      // and the information on the 2nd tab is fed in `supportingData`
      formData.value = {
        givenNames: supportingUsersData.firstName,
        lastName: supportingUsersData.lastName,
        email: supportingUsersData.email,
        gender: supportingUsersData.gender,
        dateOfBirth: dateOnlyLongString(supportingUsersData.birthDate),
        sin: supportingUsersData.sin,
        phone: supportingUsersData.contactInfo.phone,
        supportingData: supportingUsersData.supportingData,
        ...contactAddress,
      };
    });
    return { formName, formData, AESTRoutesConst };
  },
};
</script>
