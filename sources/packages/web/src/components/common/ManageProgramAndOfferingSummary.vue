<template>
  <v-card>
    <banner
      :type="BannerTypes.Error"
      header="This program is currently restricted"
    ></banner>
    <v-container :fluid="true">
      <program-details
        :program-id="programId"
        :location-id="locationId"
        :education-program="educationProgram"
        :allow-edit="allowEdit && isProgramEditable"
        :allow-deactivate="allowDeactivate && isProgramEditable"
        @program-data-updated="$emit('programDataUpdated')"
      />
      <hr class="horizontal-divider" />
      <offering-summary
        :program-id="programId"
        :location-id="locationId"
        :allow-edit="allowEdit && isProgramEditable"
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
import { BannerTypes } from "@/types";

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
      required: false,
      default: undefined,
    },
    allowEdit: {
      type: Boolean,
      required: false,
      default: true,
    },
    allowDeactivate: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const isProgramEditable = computed(
      () =>
        props.educationProgram.isActive && !props.educationProgram.isExpired,
    );
    return {
      isProgramEditable,
      BannerTypes,
    };
  },
});
</script>
