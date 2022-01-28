<template>
  <div>
    <span class="category-header-medium">Study period offerings</span>
    <v-btn
      v-if="isInstitutionUser"
      class="float-right"
      @click="goToAddNewOffering()"
      outlined
      color="#2965C5"
    >
      <v-icon size="25" left>
        mdi-open-in-new
      </v-icon>
      Add Study Period
    </v-btn>
  </div>
  <DataTable :autoLayout="true" :value="offerings">
    <Column field="offeringName" header="Name" :sortable="true"></Column>
    <Column field="studyDates" header="Study Dates" :sortable="true"></Column>
    <Column field="offeringIntensity" header="Type" :sortable="true"
      ><template #body="slotProps">
        <span>{{ slotProps.data.offeringIntensity }} </span>
      </template>
    </Column>
    <Column
      field="offeringDelivered"
      header="Study Delivery"
      :sortable="true"
    ></Column>
    <Column>
      <template #body="slotProps">
        <v-btn
          outlined
          @click="offeringButtonAction(slotProps.data.id)"
          color="#2965C5"
        >
          {{ offeringActionLabel }}
        </v-btn>
      </template>
    </Column>
  </DataTable>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, computed } from "vue";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramOfferingDto, ClientIdType } from "@/types";

export default {
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    clientType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const isInstitutionUser = computed(() => {
      return props.clientType === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return props.clientType === ClientIdType.AEST;
    });
    const offeringActionLabel = computed(() => {
      return isInstitutionUser.value ? "Edit" : "View";
    });

    const goToAddNewOffering = () => {
      if (isInstitutionUser.value) {
        router.push({
          name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
          params: {
            locationId: props.locationId,
            programId: props.programId,
            clientType: ClientIdType.Institution,
          },
        });
      }
    };

    const offeringButtonAction = (offeringId: number) => {
      if (isInstitutionUser.value) {
        router.push({
          name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
          params: {
            offeringId: offeringId,
            programId: props.programId,
            locationId: props.locationId,
            clientType: ClientIdType.Institution,
          },
        });
      }
      if (isAESTUser.value) {
        router.push({
          name: AESTRoutesConst.VIEW_OFFERING,
          params: {
            offeringId: offeringId,
            programId: props.programId,
            locationId: props.locationId,
            clientType: ClientIdType.AEST,
          },
        });
      }
    };

    const offerings = ref([] as EducationProgramOfferingDto[]);

    const getEducationProgramAndOffering = async () => {
      if (isInstitutionUser.value) {
        offerings.value = await EducationProgramOfferingService.shared.getAllEducationProgramOffering(
          props.locationId,
          props.programId,
        );
      } else if (isAESTUser.value) {
        offerings.value = await EducationProgramOfferingService.shared.getOfferingSummaryForAEST(
          props.locationId,
          props.programId,
        );
      }
    };

    onMounted(getEducationProgramAndOffering);

    return {
      goToAddNewOffering,
      offerings,
      offeringButtonAction,
      isInstitutionUser,
      isAESTUser,
      offeringActionLabel,
    };
  },
};
</script>
