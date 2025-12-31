<template>
  <v-card>
    <v-container :fluid="true">
      <program-details
        :program-id="programId"
        :location-id="locationId"
        :education-program="educationProgram"
        :is-add-offering-allowed="allowOfferingEdit"
        @program-data-updated="$emit('programDataUpdated')"
      />
      <hr class="horizontal-divider" />
      <offering-summary
        :program-id="programId"
        :location-id="locationId"
        :is-offering-edit-allowed="allowOfferingEdit"
        :institution-id="institutionId"
      />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
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
      type: Object as PropType<EducationProgramAPIOutDTO>,
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

    const isProgramEditable = computed(
      () =>
        props.educationProgram.isActive && !props.educationProgram.isExpired,
    );

    const isInstitutionUser =
      AuthService.shared.authClientType === ClientIdType.Institution;

    const allowOfferingEdit = computed(() => {
      return (
        isInstitutionUser &&
        isProgramEditable.value &&
        !isReadOnlyUser(props.locationId)
      );
    });

    return {
      allowOfferingEdit,
    };
  },
});
</script>
