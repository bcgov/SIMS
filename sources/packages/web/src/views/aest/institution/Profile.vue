<template>
  <h2 color="primary-color" class="mb-15">
    {{ initialValue.legalOperatingName }}
  </h2>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { AESTInstitutionDetailDto } from "@/types";
export default {
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const initialValue = ref({} as AESTInstitutionDetailDto);
    onMounted(async () => {
      initialValue.value = await InstitutionService.shared.getAESTInstitutionDetailById(
        props.institutionId,
      );
    });
    return {
      initialValue,
    };
  },
};
</script>
