<template>
  <banner
    class="mb-2"
    v-if="hasAccountClosedRestriction"
    :type="BannerTypes.Error"
    header="Your account has a restriction"
    :summary="ACCOUNT_CLOSED_RESTRICTION"
  />
  <banner
    class="mb-2"
    v-if="!hasAccountClosedRestriction && hasRestrictionError"
    :type="BannerTypes.Error"
    header="Your account has a restriction"
    :summary="ERROR_RESTRICTION"
  >
    <template #actions>
      <v-btn color="error" @click="viewStudentAccountActivity">
        View activity
      </v-btn>
    </template></banner
  >
  <banner
    class="mb-2"
    v-if="hasRestrictionWarning"
    :type="BannerTypes.Warning"
    header="Warning"
    :summary="RESTRICTION_WARNING"
    ><template #actions>
      <v-btn color="warning" @click="viewStudentAccountActivity">
        View account activity
      </v-btn>
    </template></banner
  >
</template>
<script lang="ts">
import { onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useStudentStore } from "@/composables";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";
import {
  ACCOUNT_CLOSED_RESTRICTION,
  ERROR_RESTRICTION,
  RESTRICTION_WARNING,
} from "@/constants";

export default defineComponent({
  setup() {
    const router = useRouter();
    const {
      updateRestrictions,
      hasAccountClosedRestriction,
      hasRestrictionError,
      hasRestrictionWarning,
    } = useStudentStore();

    const viewStudentAccountActivity = () => {
      router.push({ name: StudentRoutesConst.STUDENT_ACCOUNT_ACTIVITY });
    };

    onMounted(async () => {
      await updateRestrictions();
    });

    return {
      BannerTypes,
      hasAccountClosedRestriction,
      hasRestrictionError,
      hasRestrictionWarning,
      ACCOUNT_CLOSED_RESTRICTION,
      ERROR_RESTRICTION,
      RESTRICTION_WARNING,
      viewStudentAccountActivity,
    };
  },
});
</script>
