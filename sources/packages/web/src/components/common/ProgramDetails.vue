<template>
  <body-header :title="educationProgram.name" data-cy="programName">
    <template #status-chip>
      <status-chip-program
        class="ml-2 mb-2"
        :status="educationProgram.programStatus"
        :is-active="educationProgram.isActive && !educationProgram.isExpired"
        data-cy="programStatus"
      ></status-chip-program>
    </template>
    <template #actions>
      <v-menu class="label-bold-menu">
        <template #activator="{ props }">
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
                :disabled="isProgramDeactivationDisabled || notAllowed"
                base-color="danger"
                @click="deactivate"
                title="Deactivate"
              />
            </template>
          </check-permission-role>
        </v-list>
      </v-menu>
      <v-btn
        v-if="isAddOfferingAllowed"
        class="mr-4 float-right"
        @click="goToAddNewOffering()"
        color="primary"
        prepend-icon="fa:fa fa-plus-circle"
        data-cy="addNewOfferingButton"
      >
        Add offering
      </v-btn>
    </template>
  </body-header>
  <v-row>
    <v-col md="5">
      <title-value
        property-title="Description"
        :property-value="educationProgram.description"
        data-cy="programDescription"
      />
    </v-col>
    <v-col md="4">
      <title-value property-title="Offering" data-cy="programOffering" />
      <p class="label-value muted-content clearfix">
        <span
          v-if="
            educationProgram.programIntensity ===
              ProgramIntensity.fullTimePartTime ||
            educationProgram.programIntensity === ProgramIntensity.fullTime
          "
          >Full-Time</span
        >
        <br />
        <span
          v-if="
            educationProgram.programIntensity ===
            ProgramIntensity.fullTimePartTime
          "
          >Part-Time
        </span>
      </p>
    </v-col>
    <v-col>
      <title-value
        property-title="Credential Type"
        :property-value="educationProgram.credentialTypeToDisplay"
        data-cy="programCredential"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col md="5">
      <title-value
        property-title="Classification of Instructional Programs (CIP)"
        :property-value="educationProgram.cipCode"
        data-cy="programCIP"
      />
    </v-col>
    <v-col md="4"
      ><title-value
        property-title="National Occupational Classification (NOC)"
        :property-value="educationProgram.nocCode"
        data-cy="programNOCCode"
      />
    </v-col>
    <v-col
      ><title-value
        property-title="Institution Program Code"
        :property-value="educationProgram.institutionProgramCode"
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
import { computed, defineComponent, PropType, ref } from "vue";
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
import { ModalDialog, useInstitutionAuth, useSnackBar } from "@/composables";
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
      type: Object as PropType<EducationProgramAPIOutDTO>,
      required: true,
      default: {} as EducationProgramAPIOutDTO,
    },
    isAddOfferingAllowed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const { isReadOnlyUser } = useInstitutionAuth();
    const deactivateEducationProgramModal = ref(
      {} as ModalDialog<DeactivateProgramAPIInDTO | boolean>,
    );

    const isProgramDeactivationDisabled = computed<boolean>(
      () =>
        !props.educationProgram.isActive ||
        props.educationProgram.isExpired ||
        (AuthService.shared.authClientType === ClientIdType.Institution &&
          isReadOnlyUser(props.locationId)),
    );

    const programActionLabel = computed(() => {
      if (
        !props.educationProgram.isActive ||
        props.educationProgram.isExpired ||
        AuthService.shared.authClientType === ClientIdType.AEST
      ) {
        return "View Program";
      }
      return "Edit";
    });

    const notesRequired = computed(
      () => AuthService.shared.authClientType === ClientIdType.AEST,
    );

    /**
     * Navigates to the program details page.
     */
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

    /**
     * Navigates to the add new offering page.
     */
    const goToAddNewOffering = () => {
      if (AuthService.shared.authClientType === ClientIdType.Institution) {
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

    /**
     * Deactivates the education program.
     */
    const deactivate = async () => {
      await deactivateEducationProgramModal.value.showModal(
        undefined,
        canResolvePromise,
      );
    };

    /**
     * Resolves the promise returned by the modal dialog.
     * @param modalResult The result from the modal dialog.
     * @returns A boolean indicating whether the promise was resolved successfully.
     */
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
      } catch {
        snackBar.error("An error happened while deactivating the program.");
        return false;
      }
    };

    return {
      isProgramDeactivationDisabled,
      goToProgram,
      goToAddNewOffering,
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
