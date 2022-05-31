<template>
  <banner
    class="mb-2"
    v-if="hasRestrictionError"
    :type="BannerTypes.Error"
    header="Your account has a restriction"
    summary="You have a restriction on your account that must be resolved to continue with your student financial aid. Please view the message and resolve the items to minimize disruption and impact."
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
    header="Your account has a warning"
    summary="You should resolve this as soon as possible to minimize impact to your funding. Please view the message and resolve the items to minimize disruption and impact."
    ><template #actions>
      <v-btn color="warning" @click="viewStudentAccountActivity">
        View activity
      </v-btn>
    </template></banner
  >
</template>
<script lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStudentStore } from "@/composables";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/components/generic/Banner.models";
export default {
  setup() {
    const router = useRouter();
    const { updateRestrictions, hasRestrictionError, hasRestrictionWarning } =
      useStudentStore();

    const viewStudentAccountActivity = () => {
      router.push({ name: StudentRoutesConst.STUDENT_ACCOUNT_ACTIVITY });
    };

    onMounted(async () => {
      await updateRestrictions();
    });

    return {
      BannerTypes,
      hasRestrictionError,
      hasRestrictionWarning,
      viewStudentAccountActivity,
    };
  },
};
</script>
