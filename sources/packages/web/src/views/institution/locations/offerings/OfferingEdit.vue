<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="routeLocation"
        subTitle="Edit Offering"
      >
        <template #buttons>
          <v-row class="p-0 m-0">
            <v-menu v-if="hasExistingApplication">
              <template v-slot:activator="{ props }">
                <v-btn
                  class="ml-2"
                  color="primary"
                  prepend-icon="fa:fa fa-chevron-circle-down"
                  v-bind="props"
                  >Edit Actions</v-btn
                >
              </template>
              <v-list
                active-class="active-list-item"
                density="compact"
                bg-color="default"
                color="primary"
              >
                <template v-for="(item, index) in items" :key="index">
                  <v-list-item :value="index">
                    <v-list-item-title @click="item.command">
                      <span class="label-bold">{{ item.label }}</span>
                    </v-list-item-title>
                  </v-list-item>
                  <v-divider-inset-opaque
                    v-if="index < items.length - 1"
                    :key="index"
                  ></v-divider-inset-opaque>
                </template>
              </v-list>
            </v-menu>
          </v-row>
        </template>
      </header-navigator>
    </template>
    <template #alerts>
      <banner
        v-if="hasExistingApplication"
        class="mb-2"
        :type="BannerTypes.Success"
        header="Students have applied financial aid for this offering"
        summary="You can still make changes to the name. If you need edit the locked fields, please click on the edit actions menu and request to edit."
      />
    </template>
    <template #details-header>
      <program-offering-detail-header
        :headerDetails="{
          ...initialData,
          status: initialData.offeringStatus,
        }"
      />
    </template>
    <offering-form-submit
      submitLabel="Update offering now"
      :data="initialData"
      :formMode="formMode"
      :locationId="locationId"
      :programId="programId"
      :enableValidationsOnInit="true"
      @submit="submit"
      @cancel="goBack"
    ></offering-form-submit>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { onMounted, ref, computed, defineComponent } from "vue";
import {
  ApiProcessError,
  OfferingFormModel,
  OfferingFormModes,
  OfferingStatus,
} from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  ModalDialog,
  useFormioUtils,
  useInstitutionAuth,
  useSnackBar,
} from "@/composables";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingBasicDataAPIInDTO,
  OfferingAssessmentAPIInDTO,
} from "@/services/http/dto";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingFormSubmit from "@/components/common/OfferingFormSubmit.vue";
import { BannerTypes } from "@/types/contracts/Banner";

export default defineComponent({
  components: {
    ProgramOfferingDetailHeader,
    OfferingFormSubmit,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const { isReadOnlyUser } = useInstitutionAuth();
    const processing = ref(false);
    const formMode = ref(OfferingFormModes.Readonly);
    const items = [
      {
        label: "Request Change",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.OFFERING_REQUEST_CHANGE,
            params: {
              programId: props.programId,
              offeringId: props.offeringId,
              locationId: props.locationId,
            },
          });
        },
      },
    ];
    const initialData = ref({} as OfferingFormModel);
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );

    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
      params: {
        programId: props.programId,
        locationId: props.locationId,
      },
    }));

    const hasExistingApplication = computed(
      () =>
        initialData.value.hasExistingApplication &&
        initialData.value.offeringStatus === OfferingStatus.Approved,
    );

    const hasReadonlyStatus = (status: OfferingStatus): boolean => {
      return ![
        OfferingStatus.Approved,
        OfferingStatus.CreationPending,
        OfferingStatus.CreationDeclined,
      ].includes(status);
    };

    const loadFormData = async () => {
      const programOffering =
        await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
          props.locationId,
          props.programId,
          props.offeringId,
        );

      let mode = OfferingFormModes.Readonly;
      const isReadonly = hasReadonlyStatus(programOffering.offeringStatus);
      if (!isReadonly) {
        mode = programOffering.hasExistingApplication
          ? OfferingFormModes.AssessmentDataReadonly
          : OfferingFormModes.Editable;
      }
      formMode.value = mode;
      if (isReadOnlyUser(props.locationId)) {
        // If user is readonly, set form mode to readonly.
        formMode.value = OfferingFormModes.Readonly;
      }
      initialData.value = programOffering as OfferingFormModel;
    };

    onMounted(async () => {
      await loadFormData();
    });

    const submit = async (
      data:
        | EducationProgramOfferingAPIInDTO
        | EducationProgramOfferingBasicDataAPIInDTO,
    ) => {
      try {
        processing.value = true;

        if (initialData.value.hasExistingApplication) {
          const typedData = excludeExtraneousValues(
            EducationProgramOfferingBasicDataAPIInDTO,
            data,
          );
          await EducationProgramOfferingService.shared.updateProgramOfferingBasicInformation(
            props.locationId,
            props.programId,
            props.offeringId,
            typedData,
          );
        } else {
          const typedData = excludeExtraneousValues(
            EducationProgramOfferingAPIInDTO,
            data,
          );
          await EducationProgramOfferingService.shared.updateProgramOffering(
            props.locationId,
            props.programId,
            props.offeringId,
            typedData,
          );
        }
        snackBar.success("Offering updated.");
        goBack();
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
        } else {
          snackBar.error(
            "Unexpected error happened while creating the offering.",
          );
        }
      } finally {
        processing.value = false;
      }
    };

    const goBack = () => {
      router.push(routeLocation.value);
    };

    return {
      initialData,
      InstitutionRoutesConst,
      OfferingStatus,
      assessOfferingModalRef,
      BannerTypes,
      hasExistingApplication,
      items,
      routeLocation,
      formMode,
      processing,
      submit,
      goBack,
    };
  },
});
</script>
