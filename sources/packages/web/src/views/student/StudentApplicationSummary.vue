<template>
  <div class="p-m-4">
    <RestrictionBanner
      v-if="hasRestriction"
      :restrictionMessage="restrictionMessage"
    />
    <CheckValidSINBanner />
    <HeaderNavigator subTitle="My Applications" />
    <v-row>
      <span class="p-m-4"
        >A list of your applications for funding, grants, and busaries.</span
      >
      <v-col cols="12">
        <span class="float-right"
          ><StartApplication :hasRestriction="hasRestriction"
        /></span>
      </v-col>
      <v-col cols="12">
        <StudentApplications />
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { StudentService } from "@/services/StudentService";
import StartApplication from "@/views/student/financial-aid-application/Applications.vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import { ApplicationStatus } from "@/types";
import StudentApplications from "@/components/aest/StudentApplications.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: {
    StartApplication,
    RestrictionBanner,
    StudentApplications,
    CheckValidSINBanner,
    HeaderNavigator,
  },
  setup() {
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");

    onMounted(async () => {
      const restrictions = await StudentService.shared.getStudentRestriction();

      hasRestriction.value = restrictions.hasRestriction;
      restrictionMessage.value = restrictions.restrictionMessage;
    });

    return {
      ApplicationStatus,
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>
