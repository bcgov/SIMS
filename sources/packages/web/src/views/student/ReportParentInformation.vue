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
    <supporting-user-form
      :supporting-user-id="supportingUserId"
      @form-submitted="updateSupportingUser"
      :update-in-progress="supportingUserUpdateInProgress"
    ></supporting-user-form>
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { useFormioUtils, useSnackBar } from "@/composables";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import SupportingUserForm from "@/components/common/SupportingUserForm.vue";
import { ReportedSupportingUserAPIInDTO } from "@/services/http/dto";
import { useRouter } from "vue-router";

export default defineComponent({
  components: { ApplicationHeaderTitle, SupportingUserForm },
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
    const { excludeExtraneousValues } = useFormioUtils();
    const router = useRouter();
    const snackBar = useSnackBar();
    const supportingUserUpdateInProgress = ref(false);

    const updateSupportingUser = async (formData: Record<string, unknown>) => {
      supportingUserUpdateInProgress.value = true;
      const typedData = excludeExtraneousValues(
        ReportedSupportingUserAPIInDTO,
        formData,
      );
      try {
        await SupportingUsersService.shared.updateSupportingUser(
          props.supportingUserId,
          typedData,
        );
        snackBar.success("Parent information reported successfully.");
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: props.applicationId,
          },
        });
      } catch {
        snackBar.error("Unexpected error reporting parent information.");
      } finally {
        supportingUserUpdateInProgress.value = false;
      }
    };
    return {
      updateSupportingUser,
      supportingUserUpdateInProgress,
      StudentRoutesConst,
      BannerTypes,
    };
  },
});
</script>
