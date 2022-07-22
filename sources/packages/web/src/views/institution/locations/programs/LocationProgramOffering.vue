<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program detail"
        :routeLocation="routeLocation"
        :subTitle="subTitle"
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
              <v-list>
                <template v-for="(item, index) in items" :key="index">
                  <v-list-item :value="index">
                    <v-list-item-title @click="item.command">
                      <span class="label-bold">{{ item.label }}</span>
                    </v-list-item-title>
                  </v-list-item>
                  <v-divider
                    v-if="index < items.length - 1"
                    :key="index"
                    inset
                  ></v-divider>
                </template>
              </v-list>
            </v-menu>
          </v-row>
        </template>
      </header-navigator>
      <program-offering-detail-header
        v-if="offeringId"
        class="m-4"
        :headerDetails="{
          ...initialData,
          status: initialData.offeringStatus,
          institutionId: institutionId,
        }"
      />
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
    <offering-form
      :data="initialData"
      :readOnly="false"
      @saveOffering="saveOffering"
    ></offering-form>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import { OfferingFormModel, OfferingStatus, OfferingDTO } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog } from "@/composables";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingForm,
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
  setup(props: any) {
    const snackBar = useSnackBar();
    const router = useRouter();
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
    const initialData = ref({} as Partial<OfferingFormModel>);
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );

    const subTitle = computed(() =>
      props.offeringId ? "Edit Study Period" : "Add Study Period",
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

    const loadFormData = async () => {
      const programDetails = await EducationProgramService.shared.getProgram(
        props.programId,
      );
      //On create new offering, there won't be any offering details to be set.
      if (props.offeringId) {
        const programOffering =
          await EducationProgramOfferingService.shared.getProgramOffering(
            props.locationId,
            props.programId,
            props.offeringId,
          );
        initialData.value = {
          programIntensity: programDetails.programIntensity,
          programDeliveryTypes: programDetails.programDeliveryTypes,
          hasWILComponent: programDetails.hasWILComponent,
          ...programOffering,
        };
      } else {
        initialData.value = {
          programIntensity: programDetails.programIntensity,
          programDeliveryTypes: programDetails.programDeliveryTypes,
          hasWILComponent: programDetails.hasWILComponent,
        };
      }
    };
    onMounted(async () => {
      await loadFormData();
    });

    const saveOffering = async (data: OfferingDTO) => {
      try {
        //Update offering
        if (props.offeringId) {
          await EducationProgramOfferingService.shared.updateProgramOffering(
            props.locationId,
            props.programId,
            props.offeringId,
            data,
          );
          snackBar.success("Education Offering updated successfully!");
        } else {
          //Create new offering
          await EducationProgramOfferingService.shared.createProgramOffering(
            props.locationId,
            props.programId,
            data,
          );
          snackBar.success("Education Offering created successfully!");
        }
        router.push(routeLocation.value);
      } catch (error: unknown) {
        snackBar.error("An error happened during the Offering saving process.");
      }
    };

    return {
      saveOffering,
      initialData,
      InstitutionRoutesConst,
      subTitle,
      OfferingStatus,
      assessOfferingModalRef,
      BannerTypes,
      hasExistingApplication,
      items,
      routeLocation,
    };
  },
};
</script>
