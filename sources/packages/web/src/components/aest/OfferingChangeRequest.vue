<template>
  <offering-form :data="initialData"></offering-form>
</template>

<script lang="ts">
import { onMounted, ref, SetupContext, defineComponent } from "vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { OfferingStatus, OfferingRelationType } from "@/types";
import { EducationProgramOfferingAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default defineComponent({
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
    const initialData = ref({} as EducationProgramOfferingAPIOutDTO);

    onMounted(async () => {
      let offering: EducationProgramOfferingAPIOutDTO;
      if (props.relationType === OfferingRelationType.ActualOffering) {
        offering =
          await EducationProgramOfferingService.shared.getOfferingDetails(
            props.offeringId,
          );
      } else {
        offering =
          await EducationProgramOfferingService.shared.getPrecedingOfferingByActualOfferingId(
            props.offeringId,
          );
      }
      initialData.value = offering;
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
});
</script>
