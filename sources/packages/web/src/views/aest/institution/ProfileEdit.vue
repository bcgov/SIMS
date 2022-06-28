<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="title"
        :subTitle="subTitle"
        :routeLocation="goBackRoute"
      />
    </template>
    <institution-profile-form
      :profileData="institutionProfileModel"
      @submitInstitutionProfile="updateInstitution"
    ></institution-profile-form>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ClientIdType } from "@/types";
import { InstitutionDetailAPIOutDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useToastMessage } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";

enum FormMode {
  Create = "create",
  Edit = "edit",
}

type InstitutionDetailFormModel = InstitutionDetailAPIOutDTO & {
  mode: FormMode;
};

export default {
  components: { InstitutionProfileForm },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const institutionProfileModel = ref({} as InstitutionDetailFormModel);

    const title = computed(() =>
      props.institutionId ? "Profile" : "Dashboard",
    );

    const subTitle = computed(() =>
      props.institutionId ? "Edit Profile" : "Create institution profile",
    );

    const goBackRoute = computed(() => {
      if (props.institutionId) {
        return {
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: props.institutionId },
        };
      }
      return {
        name: AESTRoutesConst.AEST_DASHBOARD,
      };
    });

    const updateInstitution = async (data: InstitutionDetailFormModel) => {
      if (props.institutionId) {
        try {
          await InstitutionService.shared.updateInstitution(
            data,
            props.institutionId,
          );
          toast.success(
            "Update Successful",
            "Institution successfully updated!",
          );
          router.push(goBackRoute.value);
        } catch (error) {
          toast.error(
            "Unexpected error",
            "Unexpected error while updating the institution.",
          );
        }
      } else {
        try {
          await InstitutionService.shared.createInstitution(data);
          toast.success(
            "Successfully created",
            "Institution successfully created!",
          );
          router.push(goBackRoute.value);
        } catch (error) {
          toast.error(
            "Unexpected error",
            "Unexpected error while creating the institution.",
          );
        }
      }
    };

    onMounted(async () => {
      if (props.institutionId) {
        const institutionDetailAPIOutDTO =
          await InstitutionService.shared.getDetail(props.institutionId);
        institutionProfileModel.value = {
          ...institutionDetailAPIOutDTO,
          clientType: ClientIdType.AEST,
          mode: FormMode.Edit,
        };
      } else {
        institutionProfileModel.value.clientType = ClientIdType.AEST;
        institutionProfileModel.value.mode = FormMode.Create;
      }
    });

    return {
      institutionProfileModel,
      updateInstitution,
      goBackRoute,
      title,
      subTitle,
    };
  },
};
</script>
