<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application details"
        sub-title="Partner information"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: applicationId,
          },
        }"
      />
      <application-header-title :application-id="versionApplicationId" />
    </template>
    <template #alerts>
      <banner
        summary="You are submitting this declaration on behalf of your partner. Please complete the following financial information questions with your partner's information."
        :type="BannerTypes.Info"
      ></banner>
    </template>
    <supporting-user-form
      :supporting-user-id="supportingUserId"
      @form-submitted="updateSupportingUser"
      :update-in-progress="supportingUserUpdateInProgress"
      :is-readonly="false"
    ></supporting-user-form>
  </student-page-container>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from "vue";
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
    // When reporting partner information as part of a change request,
    // this property will hold the change request application id.
    changeRequestApplicationId: {
      type: Number,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const { excludeExtraneousValues } = useFormioUtils();
    const router = useRouter();
    const snackBar = useSnackBar();
    const supportingUserUpdateInProgress = ref(false);
    // Version of application id to be used to get current application context.
    const versionApplicationId = computed(
      () => props.changeRequestApplicationId ?? props.applicationId,
    );

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
        snackBar.success("Partner information reported successfully.");
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: props.applicationId,
          },
        });
      } catch {
        snackBar.error("Unexpected error reporting partner information.");
      } finally {
        supportingUserUpdateInProgress.value = false;
      }
    };
    return {
      updateSupportingUser,
      supportingUserUpdateInProgress,
      StudentRoutesConst,
      BannerTypes,
      versionApplicationId,
    };
  },
});
</script>
