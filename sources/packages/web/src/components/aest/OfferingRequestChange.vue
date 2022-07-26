<template>
  <offering-form :data="initialData"></offering-form>
</template>

<script lang="ts">
import { onMounted, ref, SetupContext } from "vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  OfferingFormEditModel,
  OfferingStatus,
  OfferingRelationType,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/components/generic/Banner.models";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default {
  components: {
    OfferingForm,
  },
  props: {
    relationType: {
      type: String,
      required: true,
      default: OfferingRelationType.ActualOffering,
      validator: (val: string) => val in OfferingRelationType,
    },
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
    const initialData = ref({} as OfferingFormEditModel);

    onMounted(async () => {
      const program =
        await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );
      if (props.relationType === OfferingRelationType.ActualOffering) {
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
      } else {
        const offering =
          await EducationProgramOfferingService.shared.getPrecedingOfferingByActualOfferingId(
            props.offeringId,
          );

        initialData.value = {
          ...offering,
          programIntensity: program.programIntensity,
          programDeliveryTypes: program.programDeliveryTypes,
          hasWILComponent: program.hasWILComponent,
        };
      }
      context.emit("getHeaderDetails", {
        ...initialData.value,
        status: initialData.value.offeringStatus,
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
