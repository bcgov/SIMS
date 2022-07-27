<template>
  <offering-form :data="initialData"></offering-form>
</template>

<script lang="ts">
import { onMounted, ref, SetupContext } from "vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { OfferingFormBaseModel, OfferingStatus } from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/components/generic/Banner.models";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default {
  components: {
    OfferingForm,
  },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
  },
  emits: ["getHeaderDetails"],
  setup(props: any, context: SetupContext) {
    const initialData = ref({} as OfferingFormBaseModel);

    onMounted(async () => {
      const program =
        await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );

      const offering =
        await EducationProgramOfferingService.shared.getProgramOfferingForAEST(
          props.offeringId,
        );

      initialData.value = {
        ...offering,
        programIntensity: program.programIntensity,
        programDeliveryTypes: program.programDeliveryTypes,
        hasWILComponent: program.hasWILComponent,
      };
      context.emit("getHeaderDetails", {
        institutionName: offering.institutionName,
        submittedDate: offering.submittedDate,
        status: offering.offeringStatus,
        assessedBy: offering.assessedBy,
        assessedDate: offering.assessedDate,
        locationName: offering.locationName,
      });
    });

    return {
      initialData,
      OfferingStatus,
      BannerTypes,
      AESTRoutesConst,
    };
  },
};
</script>
