<template>
  <header-navigator
    title="Program detail"
    :routeLocation="getRouteLocation"
    :subTitle="getSubtitle"
  >
  </header-navigator>
  <div class="mt-4 mb-2">
    <banner
      v-if="initialData.hasOfferings"
      :type="BannerTypes.Success"
      header="Students have applied financial aid for this program"
      summary="You can still make changes to the program name and description without impacting the students funding. Please create a new program if you'd like to edit the other fields."
    >
      <template #actions>
        <v-btn color="success" @click="createNewProgram">
          Create program
        </v-btn>
      </template>
    </banner>
  </div>
  <full-page-container class="mt-2">
    <formio
      formName="educationprogram"
      :data="initialData"
      :readOnly="isReadonly"
      @submitted="submitted"
    ></formio>
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
import { InstitutionService } from "@/services/InstitutionService";
import { ClientIdType } from "@/types";
import { useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { BannerTypes } from "@/types/contracts/Banner";
import { InstitutionDetailAPIOutDTO } from "@/services/http/dto";

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
    const snackBar = useSnackBar();
    const router = useRouter();
    const institutionId = ref();
    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const isReadonly = computed(() => {
      return isAESTUser.value;
    });
    // Data-bind
    const initialData = ref({} as any);
    let institution = {} as InstitutionDetailAPIOutDTO;

    const loadFormData = async () => {
      if (isInstitutionUser.value) {
        institution = await InstitutionService.shared.getDetail();
        if (props.programId) {
          const program = await EducationProgramService.shared.getProgram(
            props.programId,
          );
          initialData.value = {
            ...program,
            ...{ isBCPrivate: institution.isBCPrivate },
          };
        } else {
          initNewFormData();
        }
      }
      if (isAESTUser.value) {
        const programDetails =
          await EducationProgramService.shared.getEducationProgramForAEST(
            props.programId,
          );
        institutionId.value = programDetails.institutionId;
        initialData.value = {
          ...programDetails,
          ...{ isBCPrivate: programDetails.regulatoryBody },
        };
      }
    };

    onMounted(async () => {
      await loadFormData();
    });

    const goBack = () => {
      if (isInstitutionUser.value && props.programId) {
        // in edit program mode
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } else if (isInstitutionUser.value && !props.programId) {
        // in create program mode
        router.push({
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
      } else if (isAESTUser.value) {
        // in view program mode
        router.push({
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: institutionId.value,
            locationId: props.locationId,
          },
        });
      }
    };

    const getRouteLocation = computed(() => {
      if (isInstitutionUser.value && props.programId) {
        // in edit program mode
        return {
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        };
      } else if (isInstitutionUser.value && !props.programId) {
        // in create program mode
        return {
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        };
      } else if (isAESTUser.value) {
        // in view program mode
        return {
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: institutionId.value,
            locationId: props.locationId,
          },
        };
      }
      return {};
    });

    const getSubtitle = computed(() => {
      if (isReadonly.value) {
        return "View Program";
      } else if (props.programId && !isReadonly.value) {
        return "Edit Program";
      } else if (!props?.programId) {
        return "Create New Program";
      }
      return "";
    });

    const submitted = async (data: any) => {
      if (isInstitutionUser.value) {
        try {
          if (props.programId) {
            await EducationProgramService.shared.updateProgram(
              props.programId,
              data,
            );
            snackBar.success("Education Program updated successfully!");
          } else {
            await EducationProgramService.shared.createProgram(data);
            snackBar.success("Education Program created successfully!");
          }
          goBack();
        } catch (excp) {
          snackBar.error("An error happened during the saving process.");
        }
      }
    };

    const createNewProgram = () => {
      initialData.value = {};
      initNewFormData();
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
        },
      });
    };

    const initNewFormData = () => {
      initialData.value = {
        isBCPrivate: institution.isBCPrivate,
        hasOfferings: false,
      };
    };

    return {
      initialData,
      submitted,
      isReadonly,
      goBack,
      InstitutionRoutesConst,
      createNewProgram,
      institution,
      getRouteLocation,
      getSubtitle,
      BannerTypes,
    };
  },
};
</script>
