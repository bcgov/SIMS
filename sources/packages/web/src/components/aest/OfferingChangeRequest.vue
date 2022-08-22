<template>
  <offering-form :data="initialData"></offering-form>
</template>

<script lang="ts">
import { onMounted, ref, SetupContext } from "vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  OfferingFormBaseModel,
  OfferingStatus,
  OfferingRelationType,
} from "@/types";
import { EducationProgramOfferingAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
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
  //TODO: This emit needs to be removed when the program and offering header component
  //TODO: is enhanced to load header values with it's own API call.
  emits: ["getHeaderDetails"],
  setup(props: any, context: SetupContext) {
    const initialData = ref({} as OfferingFormBaseModel);

    onMounted(async () => {
      const programPromise = EducationProgramService.shared.getEducationProgram(
        props.programId,
      );
      let offeringPromise: Promise<EducationProgramOfferingAPIOutDTO>;

      if (props.relationType === OfferingRelationType.ActualOffering) {
        offeringPromise =
          EducationProgramOfferingService.shared.getOfferingDetails(
            props.offeringId,
          );
      } else {
        offeringPromise =
          EducationProgramOfferingService.shared.getPrecedingOfferingByActualOfferingId(
            props.offeringId,
          );
      }

      const [program, offering] = await Promise.all([
        programPromise,
        offeringPromise,
      ]);

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
