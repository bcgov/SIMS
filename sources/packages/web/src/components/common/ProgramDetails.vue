<template>
  <body-header
    :title="educationProgram.name"
    title-header-level="2"
    data-cy="programName"
  >
    <template #status-chip>
      <status-chip-program
        class="ml-2 mb-2"
        :status="educationProgram.programStatus"
        :is-active="educationProgram.isActive"
        data-cy="programStatus"
      ></status-chip-program>
    </template>
    <template #actions>
      <v-menu class="label-bold-menu">
        <template v-slot:activator="{ props }">
          <v-btn
            color="primary"
            v-bind="props"
            prepend-icon="fa:fa fa-chevron-circle-down"
            class="float-right"
          >
            Program actions
          </v-btn>
        </template>
        <v-list
          active-class="active-list-item"
          density="compact"
          bg-color="default"
          color="primary"
        >
          <v-list-item @click="goToProgram" :title="programActionLabel" />
          <v-divider-inset-opaque />
          <check-permission-role
            :role="Role.InstitutionDeactivateEducationProgram"
          >
            <template #="{ notAllowed }">
              <v-list-item
                :disabled="!educationProgram.isActive || notAllowed"
                base-color="danger"
                @click="deactivate"
                title="Deactivate"
              />
            </template>
          </check-permission-role>
        </v-list>
      </v-menu>
    </template>
  </body-header>
  <v-row>
    <v-col md="5">
      <title-value
        propertyTitle="Description"
        :propertyValue="educationProgram.description"
        data-cy="programDescription"
      />
    </v-col>
    <v-col md="4">
      <title-value propertyTitle="Offering" data-cy="programOffering" />
      <p class="label-value muted-content clearfix">
        <span
          v-if="
            educationProgram.programIntensity ===
              ProgramIntensity.fullTimePartTime ||
            educationProgram.programIntensity === ProgramIntensity.fullTime
          "
          >Full Time</span
        >
        <br />
        <span
          v-if="
            educationProgram.programIntensity ===
            ProgramIntensity.fullTimePartTime
          "
          >Part Time
        </span>
      </p>
    </v-col>
    <v-col>
      <title-value
        propertyTitle="Credential Type"
        :propertyValue="educationProgram.credentialTypeToDisplay"
        data-cy="programCredential"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col md="5">
      <title-value
        propertyTitle="Classification of Instructional Programs (CIP)"
        :propertyValue="educationProgram.cipCode"
        data-cy="programCIP"
      />
    </v-col>
    <v-col md="4"
      ><title-value
        propertyTitle="National Occupational Classification (NOC)"
        :propertyValue="educationProgram.nocCode"
        data-cy="programNOCCode"
      />
    </v-col>
    <v-col
      ><title-value
        propertyTitle="Institution Program Code"
        :propertyValue="educationProgram.institutionProgramCode"
        data-cy="programCode"
      />
    </v-col>
  </v-row>
  <education-program-deactivation-modal
    ref="deactivateEducationProgramModal"
    :notes-required="notesRequired"
  />
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { computed, defineComponent, ref } from "vue";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { ProgramIntensity, ClientIdType } from "@/types";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { AuthService } from "@/services/AuthService";
import {
  DeactivateProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";
import EducationProgramDeactivationModal from "@/components/common/modals/EducationProgramDeactivationModal.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import ApiClient from "@/services/http/ApiClient";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role } from "@/types";

export default defineComponent({
  emits: {
    programDataUpdated: null,
  },
  components: {
    EducationProgramDeactivationModal,
    StatusChipProgram,
    CheckPermissionRole,
  },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramAPIOutDTO,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const deactivateEducationProgramModal = ref(
      {} as ModalDialog<DeactivateProgramAPIInDTO | boolean>,
    );

    const programActionLabel = computed(() => {
      if (
        !props.educationProgram.isActive ||
        AuthService.shared.authClientType === ClientIdType.AEST
      ) {
        return "View Program";
      }
      return "Edit";
    });

    const goToProgram = () => {
      if (AuthService.shared.authClientType === ClientIdType.Institution) {
        return router.push({
          name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      }
      return router.push({
        name: AESTRoutesConst.VIEW_PROGRAM,
        params: {
          programId: props.programId,
          locationId: props.locationId,
        },
      });
    };

    const notesRequired = computed(
      () => AuthService.shared.authClientType === ClientIdType.AEST,
    );

    const deactivate = async () => {
      await deactivateEducationProgramModal.value.showModal(
        undefined,
        canResolvePromise,
      );
    };

    const canResolvePromise = async (
      modalResult: DeactivateProgramAPIInDTO | boolean,
    ): Promise<boolean> => {
      if (modalResult === false) {
        return true;
      }
      try {
        await ApiClient.EducationProgram.deactivateProgram(
          props.programId,
          modalResult as DeactivateProgramAPIInDTO,
        );
        snackBar.success("Program deactivated with success.");
        emit("programDataUpdated");
        return true;
      } catch (error) {
        snackBar.error("An error happened while deactivating the program.");
        return false;
      }
    };

    return {
      goToProgram,
      ProgramIntensity,
      programActionLabel,
      deactivateEducationProgramModal,
      deactivate,
      notesRequired,
      Role,
    };
  },
});
</script>
