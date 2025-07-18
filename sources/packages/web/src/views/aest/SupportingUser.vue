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
  <div v-if="parentFullName">
    <detail-header
      class="mb-2"
      :header-map="{ 'Parent Name': parentFullName }"
    />
  </div>
  <full-page-container class="my-2">
    <supporting-user-form
      v-if="supportingUser"
      :supporting-user-id="supportingUserId"
      :is-readonly="true"
    ></supporting-user-form>
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
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import SupportingUserForm from "@/components/common/SupportingUserForm.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";

export default defineComponent({
  components: {
    ApplicationHeaderTitle,
    DetailHeader,
    SupportingUserForm,
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
    const parentFullName = ref<string>();
    const supportingUser = ref<boolean>(false);

    onMounted(async () => {
      const supportingUsersData =
        await SupportingUsersService.shared.getSupportingUserData(
          props.supportingUserId,
        );
      parentFullName.value = supportingUsersData.parentFullName;
      supportingUser.value = !!supportingUsersData.supportingData;
    });
    return {
      parentFullName,
      supportingUser,
      AESTRoutesConst,
      BannerTypes,
    };
  },
});
</script>
