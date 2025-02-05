<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Programs"
        :routeLocation="getRouteLocation"
        :subTitle="subTitle"
      />
    </template>
    <template #alerts>
      <banner
        v-if="programData.hasOfferings"
        :type="BannerTypes.Success"
        header="Program details no longer editable"
        summary="This program has study period offerings attached to it, and the program details can no longer be edited. If revisions are required other than to program name or program description, you must create a new program with the correct details."
      >
        <template #actions>
          <v-btn
            color="success"
            @click="createNewProgram"
            class="btn-font-color-light"
          >
            Create program
          </v-btn>
        </template>
      </banner>
    </template>
    <formio-container
      formName="educationProgram"
      :formData="programData"
      @submitted="submitted"
      ><template #actions="{ submit }" v-if="!programData.isReadonly">
        <footer-buttons
          :processing="processing"
          primaryLabel="Submit"
          @primaryClick="submit"
          @secondaryClick="goBack"
          :disablePrimaryButton="isReadOnlyUser($props.locationId)"
        /> </template
    ></formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { ref, computed, defineComponent, isReadonly, onMounted } from "vue";
import { ApiProcessError, ClientIdType, FormIOForm } from "@/types";
import { useFormioUtils, useInstitutionAuth, useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { BannerTypes } from "@/types/contracts/Banner";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";

type EducationProgramFormData = EducationProgramAPIOutDTO & {
  isReadonly: boolean;
};

export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const { isReadOnlyUser } = useInstitutionAuth();
    const processing = ref(false);
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const router = useRouter();
    const clientType = computed(() => AuthService.shared.authClientType);
    const programData = ref({} as EducationProgramFormData);
    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });

    const loadFormData = async () => {
      if (props.programId) {
        const educationProgram =
          await EducationProgramService.shared.getEducationProgram(
            props.programId,
          );
        programData.value = {
          ...educationProgram,
          isReadonly:
            isAESTUser.value ||
            !educationProgram.isActive ||
            educationProgram.isExpired,
        };
      } else {
        // Initialize programData with institution profile data.
        const institutionProfile = await InstitutionService.shared.getDetail();
        programData.value = {
          isBCPrivate: institutionProfile.isBCPrivate,
          isBCPublic: institutionProfile.isBCPublic,
          hasOfferings: false,
          isReadonly: false,
        } as EducationProgramFormData;
      }
    };

    onMounted(async () => {
      await loadFormData();
    });

    const goBack = () => {
      if (isInstitutionUser.value && props.programId) {
        // In edit program mode.
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } else if (isInstitutionUser.value && !props.programId) {
        // In create program mode.
        router.push({
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
      } else if (isAESTUser.value) {
        // In view program mode.
        router.push({
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: programData.value.institutionId,
            locationId: props.locationId,
          },
        });
      }
    };

    const getRouteLocation = computed(() => {
      if (isInstitutionUser.value && props.programId) {
        // In edit program mode.
        return {
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        };
      } else if (isInstitutionUser.value && !props.programId) {
        // In create program mode.
        return {
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        };
      } else if (isAESTUser.value) {
        // In view program mode.
        return {
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: programData.value.institutionId,
            locationId: props.locationId,
          },
        };
      }
      return {};
    });

    const subTitle = computed(() => {
      if (programData.value.isReadonly) {
        return "View Program";
      } else if (props.programId && !programData.value.isReadonly) {
        return "Edit Program";
      } else if (!props?.programId) {
        return "Create Program";
      }
      return "";
    });

    const submitted = async (form: FormIOForm<EducationProgramAPIInDTO>) => {
      if (isInstitutionUser.value) {
        try {
          processing.value = true;
          const typedData = excludeExtraneousValues(
            EducationProgramAPIInDTO,
            form.data,
          );
          if (props.programId) {
            await EducationProgramService.shared.updateEducationProgram(
              props.programId,
              typedData,
            );
            snackBar.success("Education Program updated successfully!");
          } else {
            await EducationProgramService.shared.createEducationProgram(
              typedData,
            );
            snackBar.success("Education Program created successfully!");
          }
          goBack();
        } catch (error: unknown) {
          if (error instanceof ApiProcessError) {
            snackBar.error(error.message);
          } else {
            snackBar.error("An error happened during the saving process.");
          }
        } finally {
          processing.value = false;
        }
      }
    };

    const createNewProgram = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
        },
      });
    };

    return {
      isReadOnlyUser,
      programData,
      submitted,
      isReadonly,
      goBack,
      InstitutionRoutesConst,
      createNewProgram,
      getRouteLocation,
      subTitle,
      BannerTypes,
      processing,
    };
  },
});
</script>
