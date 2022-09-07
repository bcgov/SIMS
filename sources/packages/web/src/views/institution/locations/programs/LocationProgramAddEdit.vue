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
        header="Students have applied financial aid for this program"
        summary="You can still make changes to the program name and description without impacting the students funding. Please create a new program if you'd like to edit the other fields."
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
    <!-- todo: ann form definition -->
    <formio-container
      formName="educationProgram"
      :formData="programData"
      :readOnly="isReadonly"
      @submitted="submitted"
      ><template #actions="{ submit }" v-if="!isReadonly">
        <footer-buttons
          :processing="processing"
          primaryLabel="Submit"
          @primaryClick="submit"
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
import { onMounted, ref, computed } from "vue";
import { ClientIdType, FormIOForm } from "@/types";
import { useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { BannerTypes } from "@/types/contracts/Banner";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";

export default {
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
  setup(props: any) {
    const processing = ref(false);
    const snackBar = useSnackBar();
    const router = useRouter();
    const clientType = computed(() => AuthService.shared.authClientType);
    const programData = ref({} as EducationProgramAPIOutDTO);
    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const isReadonly = computed(() => {
      return isAESTUser.value;
    });

    const loadFormData = async () => {
      if (props.programId) {
        programData.value =
          await EducationProgramService.shared.getEducationProgram(
            props.programId,
          );
      } else {
        initNewFormData();
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
      if (isReadonly.value) {
        return "View Program";
      } else if (props.programId && !isReadonly.value) {
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
          if (props.programId) {
            await EducationProgramService.shared.updateEducationProgram(
              props.programId,
              form.data,
            );
            snackBar.success("Education Program updated successfully!");
          } else {
            await EducationProgramService.shared.createEducationProgram(
              form.data,
            );
            snackBar.success("Education Program created successfully!");
          }
          goBack();
        } catch {
          snackBar.error("An error happened during the saving process.");
        } finally {
          processing.value = false;
        }
      }
    };

    const createNewProgram = () => {
      programData.value = {} as EducationProgramAPIOutDTO;
      initNewFormData();
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
        },
      });
    };

    const initNewFormData = () => {
      programData.value = {
        isBCPrivate: programData.value.isBCPrivate,
        hasOfferings: false,
      } as EducationProgramAPIOutDTO;
    };

    return {
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
};
</script>
