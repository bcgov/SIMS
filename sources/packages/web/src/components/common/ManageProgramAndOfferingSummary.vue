<template>
  <v-card>
    <v-container :fluid="true">
      <program-details
        :program-id="programId"
        :location-id="locationId"
        :education-program="educationProgram"
        :is-offering-edit-allowed="allowOfferingEdit"
        @program-data-updated="$emit('programDataUpdated')"
      />
      <hr class="horizontal-divider" />
      <offering-summary
        :program-id="programId"
        :location-id="locationId"
        :is-offering-edit-allowed="allowOfferingEdit"
        :is-edit-allowed="allowEdit"
        :institution-id="institutionId"
      />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import { AuthService } from "@/services/AuthService";
import { ClientIdType } from "@/types";
import { useInstitutionAuth } from "@/composables";

export default defineComponent({
  emits: {
    programDataUpdated: null,
  },
  components: { ProgramDetails, OfferingSummary },
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
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { isReadOnlyUser } = useInstitutionAuth();

    const clientType = computed(() => AuthService.shared.authClientType);

    const allowEdit = computed(
      () =>
        props.educationProgram.isActive && !props.educationProgram.isExpired,
    );

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });

    const allowOfferingEdit = computed(() => {
      return (
        isInstitutionUser.value &&
        allowEdit.value &&
        !isReadOnlyUser(props.locationId)
      );
    });

    return {
      allowOfferingEdit,
      allowEdit,
    };
  },
});
</script>
