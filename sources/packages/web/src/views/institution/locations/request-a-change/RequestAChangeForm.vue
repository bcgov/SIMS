<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Request an Application Change"
        sub-title="Request a Change"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <h2 class="category-header-large primary-color">Matt Damon</h2>
    <detail-header :headerMap="headerDetailsData" />
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Application Details</h2>
    <p>Review the active program and offering details below.</p>
    <offering-view :offeringId="offeringId" :locationId="locationId" />
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Request details</h2>
    <p>
      Select a new program and offering below. This request will be shown to the
      student to allow or decline the change. If the change is allowed, the
      request will go to StudentAid BC for a final decision.
    </p>
    <v-autocomplete
      hide-details="auto"
      density="compact"
      variant="outlined"
      label="Program"
    ></v-autocomplete>
    <v-autocomplete
      hide-details="auto"
      density="compact"
      variant="outlined"
      label="Offering"
      class="mt-4"
    ></v-autocomplete>
    <v-textarea
      label="Reason for change"
      variant="outlined"
      hide-details="auto"
      class="mt-4"
    />
    <p class="mt-1 brand-gray-text">
      This note is visible to students and StudentAid BC staff.
    </p>
    <footer-buttons
      :processing="false"
      primaryLabel="Submit requested change"
      @primaryClick="submit"
      @secondaryClick="cancel"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, defineComponent, onMounted, ref } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import { ApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";

export default defineComponent({
  components: { DetailHeader },
  props: {
    offeringId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const headerDetailsData = ref<Record<string, string>>({
      "Application #": "loading...",
      Location: "location",
    });
    const requestChangeData = ref({} as ApplicationOfferingChangesAPIOutDTO);

    onMounted(async () => {
      requestChangeData.value =
        await ApplicationOfferingChangeRequestService.shared.getById(
          props.offeringId,
          {
            locationId: props.locationId,
          },
        );
    });

    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.REQUEST_CHANGE,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    const cancel = () => {
      router.push(goBackRouteParams.value);
    };

    const submit = () => {
      console.log("submit");
    };

    return {
      requestChangeData,
      submit,
      cancel,
      goBackRouteParams,
      headerDetailsData,
    };
  },
});
</script>
