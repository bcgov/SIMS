<template>
  <div class="p-m-4">
    <HeaderNavigator :title="locationName" subTitle="Report a Change" />

    <TabView lazy class="mt-4">
      <TabPanel>
        <template #header>
          <span class="ml-2">Available to report</span>
        </template>
        <ActiveApplicationSummaryData
          :locationId="locationId"
          :isArchived="true"
        />
      </TabPanel>
      <TabPanel>
        <template #header>
          <span class="ml-2">Unavailable to report</span>
        </template>
        <ActiveApplicationSummaryData
          :locationId="locationId"
          :isArchived="false"
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script lang="ts">
import ActiveApplicationSummaryData from "@/views/institution/locations/active-applications/ActiveApplicationSummaryData.vue";

export default {
  components: { ActiveApplicationSummaryData },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
  },
  // setup(props: any) {
  //   const router = useRouter();
  //   const { dateString } = useFormatters();
  //   const applications = ref([] as ActiveApplicationSummaryAPIOutDTO[]);
  //   const goToApplicationView = (applicationId: number) => {
  //     router.push({
  //       name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
  //       params: { locationId: props.locationId, applicationId },
  //     });
  //   // };
  // },
};
</script>
